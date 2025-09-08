package middleware

import (
	"net/http"
	"log"
)

func WithCORS(next http.HandlerFunc) http.HandlerFunc {
	// Allowed origins
	allowedOrigins := map[string]bool{
		"http://localhost:3000": true,
		"https://photo-capsule.vercel.app": true,
	}

	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		log.Printf("In the middleware")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
		log.Printf("end of middleware")
	}
}

