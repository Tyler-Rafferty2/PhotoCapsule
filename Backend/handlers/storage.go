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
	r.ParseMultipartForm(10 << 20)
	log.Printf("Content-Type:", r.Header.Get("Content-Type"))
	log.Printf("r.MultipartForm:", r.MultipartForm)
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file not found"+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		http.Error(w, "failed to read file", http.StatusInternalServerError)
		return
	}

	key := "uploads/" + header.Filename

	_, err = config.R2Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: &config.R2Bucket,
		Key:    &key,
		Body:   bytes.NewReader(buf.Bytes()),
	})
	if err != nil {
		http.Error(w, "upload failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "✅ Uploaded %s", key)
}
