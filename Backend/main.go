// main.go
package main

import (
	"log"
	"net/http"
	"os"
	"fmt"

	"photovault/config"
	"photovault/routes"
	"photovault/tests"
	"photovault/jobs"
	"github.com/joho/godotenv"
)

func main() {
	config.ConnectToDB()
	config.ConnectToR2()
	
	if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
		log.Fatal(err)
	}

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found; using OS env vars only")
	}

	secret := config.GetEnv("secret_token", "")
	if secret == "" {
		log.Println("Token not set. Please define secret_token in environment variables.")
	}
	config.JwtSecret = []byte(secret)
	jobs.StartCapsuleCron()
	mux := routes.SetupRoutes()
	// if err := tests.RunUploadTest(); err != nil {
    //     fmt.Println("Error:", err)
    //     return
    // }
	//fmt.Println("🚀 Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))

	
}
