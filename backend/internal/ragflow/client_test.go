package ragflow

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestDecodeNativeResponse(t *testing.T) {
	input := `{"code":0,"message":"success","data":{"answer":"Jawaban Laras","reference":{"chunks":[{"content":"Sumber","metadata":{"Link":"https://example.go.id/layanan"}}]},"session_id":"rag-session-123"}}`
	reply, err := decodeResponse([]byte(input), false)
	if err != nil {
		t.Fatalf("decodeResponse returned error: %v", err)
	}
	if reply.Answer != "Jawaban Laras" {
		t.Fatalf("unexpected answer: %q", reply.Answer)
	}
	if reply.SessionID != "rag-session-123" {
		t.Fatalf("unexpected session ID: %q", reply.SessionID)
	}
	if !json.Valid(reply.Reference) || !strings.Contains(string(reply.Reference), "example.go.id") {
		t.Fatalf("reference metadata was not preserved: %s", reply.Reference)
	}
}

func TestDecodeSSENativeResponse(t *testing.T) {
	input := "data: {\"code\":0,\"data\":{\"answer\":\"Bagian satu \",\"session_id\":\"s-1\"}}\n" +
		"data: {\"code\":0,\"data\":{\"answer\":\"bagian dua\",\"reference\":{\"chunks\":[]}}}\n" +
		"data: {\"code\":0,\"data\":true}\n"
	reply, err := decodeResponse([]byte(input), false)
	if err != nil {
		t.Fatalf("decodeResponse returned error: %v", err)
	}
	if reply.Answer != "Bagian satu bagian dua" {
		t.Fatalf("unexpected answer: %q", reply.Answer)
	}
	if reply.SessionID != "s-1" {
		t.Fatalf("unexpected session ID: %q", reply.SessionID)
	}
}

func TestDecodeOpenAICompatibleResponse(t *testing.T) {
	input := `{"choices":[{"message":{"content":"[Buka layanan](https://example.go.id)","reference":{"chunks":[]}}}]}`
	reply, err := decodeResponse([]byte(input), false)
	if err != nil {
		t.Fatalf("decodeResponse returned error: %v", err)
	}
	if !strings.Contains(reply.Answer, "https://example.go.id") {
		t.Fatalf("unexpected answer: %q", reply.Answer)
	}
}

func TestCleanAnswerRemovesThinking(t *testing.T) {
	got := cleanAnswer("<think>reasoning internal</think>Jawaban final")
	if got != "Jawaban final" {
		t.Fatalf("unexpected cleaned answer: %q", got)
	}
}
