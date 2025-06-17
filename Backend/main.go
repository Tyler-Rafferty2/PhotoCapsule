package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	// Only allow POST

	w.Header().Set("Access-Control-Allow-Origin", "*")

	
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the multipart form (10MB max)
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	// Get file from form field "image"
	file, handler, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Error retrieving the file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create destination file
	dstPath := filepath.Join("uploads", handler.Filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Could not save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Copy uploaded content to destination
	_, err = io.Copy(dst, file)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Respond
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"message":"Upload successful","filename":"%s"}`, handler.Filename)
}

func main() {
	// Make sure upload directory exists
	if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
		log.Fatal(err)
	}

	http.HandleFunc("/upload", uploadHandler)

	fmt.Println("🚀 Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
