package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"laras-chatbot-api/internal/config"
	"laras-chatbot-api/internal/httpapi"
	"laras-chatbot-api/internal/ragflow"
	"laras-chatbot-api/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("konfigurasi: %v", err)
	}

	startupCtx, cancelStartup := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelStartup()
	database, err := store.New(startupCtx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("koneksi Supabase PostgreSQL gagal: %v", err)
	}
	defer database.Close()

	ragClient := ragflow.New(cfg.RAGFlowBaseURL, cfg.RAGFlowAPIKey, cfg.RAGFlowChatID, cfg.RAGFlowTimeout)
	api := httpapi.New(database, ragClient, cfg.RAGFlowChatID, cfg.FrontendOrigins, cfg.RAGFlowTimeout)
	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           api.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      cfg.RAGFlowTimeout + 30*time.Second,
		IdleTimeout:       90 * time.Second,
	}

	go func() {
		log.Printf("Laras Chatbot API berjalan di http://localhost:%s", cfg.Port)
		log.Printf("RAGFlow base URL: %s", cfg.RAGFlowBaseURL)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}
