package model

import "time"

type Family struct {
	ID         uint      `gorm:"primaryKey"`
	Name       string    `gorm:"not null"`
	InviteCode string    `gorm:"not null;uniqueIndex"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
