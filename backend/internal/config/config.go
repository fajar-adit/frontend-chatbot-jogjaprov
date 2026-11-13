package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port            string
	FrontendOrigins []string
	DatabaseURL     string
	RAGFlowBaseURL  string
	RAGFlowAPIKey   string
	RAGFlowChatID   string
	RAGFlowTimeout  time.Duration
}

func Load() (Config, error) {
	// Loading .env is optional; environment variables from the shell take precedence.
	_ = godotenv.Load()

	cfg := Config{
		Port:            envOr("PORT", "8090"),
		FrontendOrigins: splitCSV(envOr("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")),
		DatabaseURL:     strings.TrimSpace(os.Getenv("DATABASE_URL")),
		RAGFlowBaseURL:  strings.TrimRight(strings.TrimSpace(envOr("RAGFLOW_BASE_URL", "http://localhost")), "/"),
		RAGFlowAPIKey:   strings.TrimSpace(os.Getenv("RAGFLOW_API_KEY")),
		RAGFlowChatID:   strings.TrimSpace(os.Getenv("RAGFLOW_CHAT_ID")),
	}

	seconds, err := strconv.Atoi(envOr("RAGFLOW_TIMEOUT_SECONDS", "180"))
	if err != nil || seconds < 15 || seconds > 600 {
		return Config{}, errors.New("RAGFLOW_TIMEOUT_SECONDS harus berupa angka 15 sampai 600")
	}
	cfg.RAGFlowTimeout = time.Duration(seconds) * time.Second

	missing := make([]string, 0, 4)
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if cfg.RAGFlowAPIKey == "" {
		missing = append(missing, "RAGFLOW_API_KEY")
	}
	if cfg.RAGFlowChatID == "" {
		missing = append(missing, "RAGFLOW_CHAT_ID")
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("variabel wajib belum diatur: %s", strings.Join(missing, ", "))
	}
	if cfg.Port == "" {
		cfg.Port = "8090"
	}
	return cfg, nil
}

func envOr(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}
