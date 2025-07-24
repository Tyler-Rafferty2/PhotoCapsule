package models

import (
	"time"
)

type User struct {
	ID           uint      `gorm:"primaryKey"`
	Email        string    `gorm:"unique;not null"`
	PasswordHash string    `gorm:"not null"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	Vaults       []Vault   `gorm:"foreignKey:UserID"`
}

type Vault struct {
	ID          uint      `gorm:"primaryKey"`
	UserID      uint      `gorm:"not null"`
	Title       string    `gorm:"not null"`
	Description string
	CoverImageID  *uint
	CoverImageURL *string
	UnlockDate  *time.Time
	CreatedAt   time.Time

	Uploads []Upload `gorm:"foreignKey:VaultID"`
}

type Upload struct {
	ID         uint       `gorm:"primaryKey"`
	VaultID    uint       `gorm:"not null"`
	Filename   string     `gorm:"not null"`
	UploadTime time.Time  `gorm:"autoCreateTime"`
	DeletedAt  *time.Time `gorm:"default:null"`
	OrderIndex int  	  `gorm:"not null;default:0"`
}

type CoverImage struct {
	ID              uint      `gorm:"primaryKey"`
	VaultID         uint      `gorm:"not null"`
	Filename        string    `gorm:"not null"`
	UploadTime      time.Time `gorm:"autoCreateTime"`
}

type RefreshToken struct {
    UserID      uint   `gorm:"not null"`
	Email        string    `gorm:"unique;not null"`
    TokenHash   string `gorm:"not null;uniqueIndex"`
    ExpiresAt   time.Time `gorm:"not null"`
    IsRevoked   bool   `gorm:"default:false"`
}