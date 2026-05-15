package model

import "time"

type User struct {
	ID             uint    `gorm:"primaryKey"`
	FamilyID       *uint   `gorm:"index"`
	Name           string  `gorm:"not null"`
	Role           string  `gorm:"not null;default:'member'"`
	IconURL        *string
	Email          string `gorm:"not null;uniqueIndex"`
	PasswordDigest string `gorm:"not null"`
	EnmanPoint     int    `gorm:"not null;default:0"`
	CreatedAt      time.Time
	UpdatedAt      time.Time

	Family *Family `gorm:"foreignKey:FamilyID"`
}
