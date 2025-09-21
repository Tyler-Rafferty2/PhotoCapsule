package handlers

import (
    "database/sql"
    "fmt"
    "net/http"
    "time"
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
    // Optional: check DB connection
    if err := config.DB.Ping(); err != nil {
        http.Error(w, "Database unreachable", http.StatusServiceUnavailable)
        return
    }

    // Everything is healthy
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
}