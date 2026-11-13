package ragflow

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	baseURL string
	apiKey  string
	chatID  string
	http    *http.Client
}

type Reply struct {
	Answer    string          `json:"answer"`
	SessionID string          `json:"session_id"`
	Reference json.RawMessage `json:"reference"`
}

type requestBody struct {
	ChatID    string `json:"chat_id"`
	Question  string `json:"question"`
	SessionID string `json:"session_id,omitempty"`
	Stream    bool   `json:"stream"`
}

type envelope struct {
	Code    *int            `json:"code"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

type responseData struct {
	Answer    string          `json:"answer"`
	Reference json.RawMessage `json:"reference"`
	SessionID string          `json:"session_id"`
}

func New(baseURL, apiKey, chatID string, timeout time.Duration) *Client {
	return &Client{
		baseURL: strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		apiKey:  strings.TrimSpace(apiKey),
		chatID:  strings.TrimSpace(chatID),
		http: &http.Client{
			Timeout: timeout,
		},
	}
}

func (c *Client) ChatID() string { return c.chatID }

func (c *Client) Complete(ctx context.Context, question, sessionID string) (Reply, error) {
	payload := requestBody{
		ChatID:   c.chatID,
		Question: strings.TrimSpace(question),
		Stream:   false,
	}
	if strings.TrimSpace(sessionID) != "" {
		payload.SessionID = strings.TrimSpace(sessionID)
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return Reply{}, fmt.Errorf("encode request: %w", err)
	}

	endpoint := c.baseURL + "/api/v1/chat/completions"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return Reply{}, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(req)
	if err != nil {
		return Reply{}, fmt.Errorf("request RAGFlow: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 12<<20))
	if err != nil {
		return Reply{}, fmt.Errorf("read RAGFlow response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return Reply{}, fmt.Errorf("RAGFlow mengembalikan HTTP %d: %s", resp.StatusCode, safeExcerpt(string(raw), 500))
	}

	reply, err := decodeResponse(raw, strings.Contains(strings.ToLower(resp.Header.Get("Content-Type")), "text/event-stream"))
	if err != nil {
		return Reply{}, err
	}
	if strings.TrimSpace(reply.Answer) == "" {
		return Reply{}, errors.New("RAGFlow mengembalikan jawaban kosong")
	}
	if len(reply.Reference) == 0 || !json.Valid(reply.Reference) {
		reply.Reference = json.RawMessage(`{"chunks":[]}`)
	}
	return reply, nil
}

func decodeResponse(raw []byte, isSSE bool) (Reply, error) {
	trimmed := bytes.TrimSpace(raw)
	if !isSSE && (bytes.HasPrefix(trimmed, []byte("data:")) || bytes.HasPrefix(trimmed, []byte("event:"))) {
		isSSE = true
	}
	if !isSSE {
		var env envelope
		if err := json.Unmarshal(raw, &env); err == nil {
			if env.Code != nil && *env.Code != 0 {
				msg := strings.TrimSpace(env.Message)
				if msg == "" {
					msg = fmt.Sprintf("business code %d", *env.Code)
				}
				return Reply{}, fmt.Errorf("RAGFlow: %s", msg)
			}
			if len(env.Data) > 0 {
				var data responseData
				if err := json.Unmarshal(env.Data, &data); err == nil && data.Answer != "" {
					return Reply{Answer: cleanAnswer(data.Answer), SessionID: data.SessionID, Reference: data.Reference}, nil
				}
			}
		}
		// Fallback for an OpenAI-compatible non-stream response (useful for compatible deployments).
		var openAI struct {
			Choices []struct {
				Message struct {
					Content   string          `json:"content"`
					Reference json.RawMessage `json:"reference"`
				} `json:"message"`
			} `json:"choices"`
		}
		if err := json.Unmarshal(raw, &openAI); err == nil && len(openAI.Choices) > 0 {
			msg := openAI.Choices[0].Message
			return Reply{Answer: cleanAnswer(msg.Content), Reference: msg.Reference}, nil
		}
		return Reply{}, fmt.Errorf("format respons RAGFlow tidak dikenali: %s", safeExcerpt(string(raw), 300))
	}

	return decodeSSE(raw)
}

func decodeSSE(raw []byte) (Reply, error) {
	var aggregate strings.Builder
	var last Reply
	scanner := bufio.NewScanner(bytes.NewReader(raw))
	scanner.Buffer(make([]byte, 4096), 2<<20)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		dataText := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if dataText == "" || dataText == "[DONE]" {
			continue
		}
		var env envelope
		if err := json.Unmarshal([]byte(dataText), &env); err == nil && len(env.Data) > 0 {
			if env.Code != nil && *env.Code != 0 {
				return Reply{}, fmt.Errorf("RAGFlow: %s", env.Message)
			}
			var data responseData
			if json.Unmarshal(env.Data, &data) == nil {
				if data.Answer != "" {
					aggregate.WriteString(data.Answer)
				}
				if data.SessionID != "" {
					last.SessionID = data.SessionID
				}
				if len(data.Reference) > 0 {
					last.Reference = data.Reference
				}
				continue
			}
		}
		// OpenAI-compatible SSE fallback.
		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if json.Unmarshal([]byte(dataText), &chunk) == nil && len(chunk.Choices) > 0 {
			aggregate.WriteString(chunk.Choices[0].Delta.Content)
		}
	}
	if err := scanner.Err(); err != nil {
		return Reply{}, err
	}
	last.Answer = cleanAnswer(aggregate.String())
	if last.Answer == "" {
		return Reply{}, errors.New("respons streaming RAGFlow tidak mengandung jawaban")
	}
	return last, nil
}

func cleanAnswer(answer string) string {
	answer = strings.TrimSpace(answer)
	// Remove reasoning tags if a model exposes them in its final answer.
	lower := strings.ToLower(answer)
	if start := strings.Index(lower, "<think>"); start >= 0 {
		if endRel := strings.Index(lower[start:], "</think>"); endRel >= 0 {
			end := start + endRel + len("</think>")
			answer = strings.TrimSpace(answer[:start] + answer[end:])
		}
	}
	return answer
}

func safeExcerpt(s string, max int) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "\n", " ")
	if len(s) > max {
		return s[:max] + "..."
	}
	return s
}
