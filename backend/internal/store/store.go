package store

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	pool *pgxpool.Pool
}

type Session struct {
	ID               string
	RAGFlowChatID    string
	RAGFlowSessionID string
	Title            string
}

type Message struct {
	ID        int64           `json:"id"`
	Role      string          `json:"role"`
	Content   string          `json:"content"`
	Sources   json.RawMessage `json:"sources,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

var ErrSessionNotFound = errors.New("session not found")

func New(ctx context.Context, databaseURL string) (*Store, error) {
	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	poolConfig.MaxConns = 8
	poolConfig.MinConns = 0
	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return &Store{pool: pool}, nil
}

func (s *Store) Close() { s.pool.Close() }

func (s *Store) Ping(ctx context.Context) error { return s.pool.Ping(ctx) }

func (s *Store) CreateSession(ctx context.Context, chatID, title string) (Session, error) {
	var session Session
	err := s.pool.QueryRow(ctx, `
		INSERT INTO public.laras_chatbot_sessions (ragflow_chat_id, title)
		VALUES ($1, $2)
		RETURNING id::text, ragflow_chat_id, COALESCE(ragflow_session_id, ''), title
	`, chatID, title).Scan(&session.ID, &session.RAGFlowChatID, &session.RAGFlowSessionID, &session.Title)
	return session, err
}

func (s *Store) GetSession(ctx context.Context, sessionID string) (Session, error) {
	var session Session
	err := s.pool.QueryRow(ctx, `
		SELECT id::text, ragflow_chat_id, COALESCE(ragflow_session_id, ''), title
		FROM public.laras_chatbot_sessions
		WHERE id = $1::uuid
	`, strings.TrimSpace(sessionID)).Scan(&session.ID, &session.RAGFlowChatID, &session.RAGFlowSessionID, &session.Title)
	if errors.Is(err, pgx.ErrNoRows) {
		return Session{}, ErrSessionNotFound
	}
	return session, err
}

func (s *Store) SetRAGFlowSessionID(ctx context.Context, sessionID, ragflowSessionID string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE public.laras_chatbot_sessions
		SET ragflow_session_id = $2, updated_at = NOW()
		WHERE id = $1::uuid
	`, sessionID, ragflowSessionID)
	return err
}

func (s *Store) TouchSession(ctx context.Context, sessionID string) error {
	_, err := s.pool.Exec(ctx, `UPDATE public.laras_chatbot_sessions SET updated_at = NOW() WHERE id = $1::uuid`, sessionID)
	return err
}

func (s *Store) SaveMessage(ctx context.Context, sessionID, role, content string, sources json.RawMessage) error {
	if len(sources) == 0 || !json.Valid(sources) {
		sources = json.RawMessage(`{"chunks":[]}`)
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO public.laras_chatbot_messages (session_id, role, content, sources)
		VALUES ($1::uuid, $2, $3, $4::jsonb)
	`, sessionID, role, content, string(sources))
	return err
}

func (s *Store) ListMessages(ctx context.Context, sessionID string) ([]Message, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, role, content, sources, created_at
		FROM public.laras_chatbot_messages
		WHERE session_id = $1::uuid
		ORDER BY created_at ASC, id ASC
		LIMIT 200
	`, strings.TrimSpace(sessionID))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	messages := make([]Message, 0)
	for rows.Next() {
		var msg Message
		if err := rows.Scan(&msg.ID, &msg.Role, &msg.Content, &msg.Sources, &msg.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, rows.Err()
}
