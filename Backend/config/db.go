package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectToDB() {
	log.Println("Attempting to connect to the database with hardcoded credentials...")

    // This is the hardcoded DSN string
    user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbname := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("postgresql://%s:%s@%s:%s/%s", user, password, host, port, dbname)
    
    // Log the configuration for debugging
    log.Printf("PreferSimpleProtocol will be set to true.")
	if(os.Getenv("APP_ENV") != "test"){
		var err error
		DB, err = gorm.Open(postgres.New(postgres.Config{
			DSN:                  dsn,
			PreferSimpleProtocol:  true, // disables implicit prepared statement usage
		}), &gorm.Config{})
		if err != nil {
			log.Fatal("Failed to connect to DB:", err)
		}
	}
	fmt.Println("✅ Connected to PostgreSQL database with GORM!")
}