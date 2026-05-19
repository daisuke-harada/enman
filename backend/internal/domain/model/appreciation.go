package model

import "time"

type Appreciation struct {
	ID         uint    `gorm:"primaryKey"`
	TaskID     uint    `gorm:"not null;index"`
	FromUserID uint    `gorm:"not null"`
	ToUserID   uint    `gorm:"not null;index"`
	Message    *string
	CreatedAt  time.Time

	Task     *Task `gorm:"foreignKey:TaskID"`
	FromUser *User `gorm:"foreignKey:FromUserID"`
	ToUser   *User `gorm:"foreignKey:ToUserID"`
}
