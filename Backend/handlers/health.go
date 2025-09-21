package handlers

import (
    "net/http"
    "photovault/config"
)

func HealthHandler(w http.ResponseWriter, r *http.Request) {
    sqlDB, err := config.DB.DB()
    if err != nil {
        http.Error(w, "Database error", http.StatusInternalServerError)
        return
    }

    if err := sqlDB.Ping(); err != nil {
        http.Error(w, "Database unreachable", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
}
