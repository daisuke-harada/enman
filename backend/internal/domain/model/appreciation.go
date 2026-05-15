package model

import "time"

type StampType string

const (
	StampTypeGreat  StampType = "great"
	StampTypeThanks StampType = "thanks"
	StampTypeCute   StampType = "cute"
	StampTypeLove   StampType = "love"
	StampTypeStar   StampType = "star"
)

type Appreciation struct {
	ID         uint      `gorm:"primaryKey"`
	TaskID     uint      `gorm:"not null;index"`
	FromUserID uint      `gorm:"not null"`
	ToUserID   uint      `gorm:"not null;index"`
	StampType  StampType `gorm:"not null"`
	Message    *string
	CreatedAt  time.Time

	Task     *Task `gorm:"foreignKey:TaskID"`
	FromUser *User `gorm:"foreignKey:FromUserID"`
}
