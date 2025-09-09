package handlers

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"photovault/config"

	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func UploadFile(w http.ResponseWriter, r *http.Request) {
    // Limit request body size (optional)
    r.Body = http.MaxBytesReader(w, r.Body, 20<<20) // 20MB max

    // Parse multipart form
    err := r.ParseMultipartForm(10 << 20) // 10MB
    if err != nil {
        log.Println("❌ Error parsing multipart form:", err)
        http.Error(w, "failed to parse multipart form: "+err.Error(), http.StatusBadRequest)
        return
    }

    // Debug: print all form values
    log.Println("Form Values:", r.Form)                  // text fields
    log.Println("MultipartForm File Keys:", r.MultipartForm.File) // files map

    // Attempt to get file
    file, header, err := r.FormFile("file")
    if err != nil {
        log.Println("❌ Error retrieving 'file' from form:", err)
        if r.MultipartForm != nil {
            log.Println("Available file keys:", r.MultipartForm.File)
        }
        http.Error(w, "file not found: "+err.Error(), http.StatusBadRequest)
        return
    }
    defer file.Close()

    log.Println("✅ Received file:", header.Filename)
    log.Println("Size:", header.Size, "bytes")
    log.Println("Header:", header.Header)

    // Read file into memory (for example)
    buf := new(bytes.Buffer)
    n, err := buf.ReadFrom(file)
    if err != nil {
        log.Println("❌ Error reading file:", err)
        http.Error(w, "failed to read file", http.StatusInternalServerError)
        return
    }
    log.Println("Read bytes:", n)

    fmt.Fprintf(w, "✅ Uploaded file: %s (%d bytes)", header.Filename, n)
}
