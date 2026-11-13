package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"laras-chatbot-api/internal/ragflow"
	"laras-chatbot-api/internal/store"
)

type Server struct {
	store          *store.Store
	ragflow        *ragflow.Client
	chatID         string
	allowedOrigins map[string]struct{}
	timeout        time.Duration
}

type ChatRequest struct {
	Question  string `json:"question"`
	SessionID string `json:"session_id,omitempty"`
	Category  string `json:"category,omitempty"`
}

type ChatResponse struct {
	SessionID string          `json:"session_id"`
	Answer    string          `json:"answer"`
	Sources   json.RawMessage `json:"sources"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func New(st *store.Store, client *ragflow.Client, chatID string, origins []string, timeout time.Duration) *Server {
	allowed := make(map[string]struct{}, len(origins))
	for _, origin := range origins {
		allowed[strings.TrimRight(strings.TrimSpace(origin), "/")] = struct{}{}
	}
	return &Server{store: st, ragflow: client, chatID: chatID, allowedOrigins: allowed, timeout: timeout}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", s.healthHandler)
	mux.HandleFunc("POST /api/chat", s.chatHandler)
	mux.HandleFunc("GET /api/sessions/{sessionID}/messages", s.messagesHandler)
	return s.cors(mux)
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := strings.TrimRight(strings.TrimSpace(r.Header.Get("Origin")), "/")
		if origin != "" {
			if _, ok := s.allowedOrigins[origin]; ok {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			}
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	if err := s.store.Ping(ctx); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "degraded", "service": "laras-chatbot-api", "database": "disconnected",
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok", "service": "laras-chatbot-api", "database": "connected",
	})
}

func (s *Server) chatHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, ErrorResponse{Error: "Method not allowed"})
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	var input ChatRequest
	if err := decoder.Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "JSON tidak valid atau terlalu besar"})
		return
	}
	if err := ensureEOF(decoder); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Request harus berisi satu objek JSON"})
		return
	}
	input.Question = strings.TrimSpace(input.Question)
	input.Category = strings.TrimSpace(input.Category)
	input.SessionID = strings.TrimSpace(input.SessionID)
	if input.Question == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Pertanyaan wajib diisi"})
		return
	}
	if len([]rune(input.Question)) > 4000 {
		writeJSON(w, http.StatusRequestEntityTooLarge, ErrorResponse{Error: "Pertanyaan terlalu panjang (maksimal 4000 karakter)"})
		return
	}
	if len([]rune(input.Category)) > 120 {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Kategori terlalu panjang (maksimal 120 karakter)"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), s.timeout+10*time.Second)
	defer cancel()

	var session store.Session
	var err error
	if input.SessionID == "" {
		session, err = s.store.CreateSession(ctx, s.chatID, titleFromQuestion(input.Question))
		if err != nil {
			log.Printf("create chat session: %v", err)
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Gagal membuat sesi percakapan"})
			return
		}
	} else {
		session, err = s.store.GetSession(ctx, input.SessionID)
		if errors.Is(err, store.ErrSessionNotFound) {
			writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "Sesi percakapan tidak ditemukan. Mulai percakapan baru."})
			return
		}
		if err != nil {
			log.Printf("get chat session: %v", err)
			writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "session_id tidak valid"})
			return
		}
		if session.RAGFlowChatID != s.chatID {
			writeJSON(w, http.StatusConflict, ErrorResponse{Error: "Sesi ini terhubung ke konfigurasi chatbot yang berbeda"})
			return
		}
	}

	question := input.Question
	if input.Category != "" {
		question = "Kategori layanan yang dipilih pengguna: " + input.Category + "\nPertanyaan pengguna: " + question
	}

	reply, err := s.ragflow.Complete(ctx, question, session.RAGFlowSessionID)
	if err != nil {
		log.Printf("RAGFlow completion failed: %v", err)
		writeJSON(w, http.StatusBadGateway, ErrorResponse{Error: "Laras belum dapat memperoleh jawaban dari RAGFlow. Periksa status RAGFlow/Ollama dan konfigurasi API."})
		return
	}
	if reply.SessionID != "" && reply.SessionID != session.RAGFlowSessionID {
		if err := s.store.SetRAGFlowSessionID(ctx, session.ID, reply.SessionID); err != nil {
			log.Printf("save RAGFlow session ID: %v", err)
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Jawaban dibuat tetapi sesi RAGFlow gagal disimpan"})
			return
		}
	}

	sources := reply.Reference
	if len(sources) == 0 || !json.Valid(sources) {
		sources = json.RawMessage(`{"chunks":[]}`)
	}
	if err := s.store.SaveMessage(ctx, session.ID, "user", input.Question, nil); err != nil {
		log.Printf("save user message: %v", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Jawaban didapat tetapi gagal menyimpan riwayat"})
		return
	}
	if err := s.store.SaveMessage(ctx, session.ID, "assistant", reply.Answer, sources); err != nil {
		log.Printf("save assistant message: %v", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Jawaban didapat tetapi gagal menyimpan riwayat"})
		return
	}
	_ = s.store.TouchSession(ctx, session.ID)

	writeJSON(w, http.StatusOK, ChatResponse{
		SessionID: session.ID,
		Answer:    reply.Answer,
		Sources:   sources,
	})
}

func (s *Server) messagesHandler(w http.ResponseWriter, r *http.Request) {
	sessionID := strings.TrimSpace(r.PathValue("sessionID"))
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	if _, err := s.store.GetSession(ctx, sessionID); errors.Is(err, store.ErrSessionNotFound) {
		writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "Sesi tidak ditemukan"})
		return
	} else if err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "session_id tidak valid"})
		return
	}
	messages, err := s.store.ListMessages(ctx, sessionID)
	if err != nil {
		log.Printf("list messages: %v", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Gagal membaca riwayat percakapan"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"session_id": sessionID, "messages": messages})
}

func ensureEOF(decoder *json.Decoder) error {
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		if err == nil {
			return fmt.Errorf("more than one JSON value")
		}
		return err
	}
	return nil
}

func titleFromQuestion(question string) string {
	q := strings.Join(strings.Fields(question), " ")
	runes := []rune(q)
	if len(runes) > 72 {
		q = string(runes[:69]) + "..."
	}
	if q == "" {
		return "Percakapan baru"
	}
	return q
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
