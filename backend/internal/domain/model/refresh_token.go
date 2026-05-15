package model

import "time"

type RefreshToken struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uint      `gorm:"not null;index"`
	TokenHash string    `gorm:"not null;uniqueIndex"`
	ExpiredAt time.Time `gorm:"not null"`
	CreatedAt time.Time

	User *User `gorm:"foreignKey:UserID"`
}
