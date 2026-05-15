package model

import "time"

type FamilyGoal struct {
	ID           uint      `gorm:"primaryKey"`
	FamilyID     uint      `gorm:"not null;index"`
	Title        string    `gorm:"not null"`
	TargetPoints int       `gorm:"not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
