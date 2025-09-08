package config

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectToDB() {
	log.Println("Attempting to connect to the database with hardcoded credentials...")

    // This is the hardcoded DSN string
    dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASS"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
	)
    
    // Log the configuration for debugging
    log.Printf("Using hardcoded DSN. PrepareStmt will be set to false.")

    var err error
    DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
        // This is the crucial fix for the "prepared statement" error
        PrepareStmt: false, 
    })
    if err != nil {
        log.Fatal("Failed to connect to DB:", err)
    }

	// err = DB.Ping()
    // if err != nil {
    //     log.Fatal("Could not ping DB:", err)
    // }

	// err = DB.AutoMigrate(
	// 	&models.User{},
	// 	&models.Vault{},
	// 	&models.Upload{},
	// 	&models.CoverImage{},
	// 	&models.RefreshToken{},
	// )
	// if err != nil {
	// 	// Only log warning, don’t exit
	// 	log.Println("⚠️ Auto-migration warning:", err)
	// } else {
	// 	fmt.Println("✅ DB AutoMigrate succeeded")
	// }

	fmt.Println("✅ Connected to PostgreSQL database with GORM!")
}