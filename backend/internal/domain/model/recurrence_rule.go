package model

import "time"

type RecurrenceFrequency string

const (
	RecurrenceFrequencyDaily   RecurrenceFrequency = "daily"
	RecurrenceFrequencyWeekly  RecurrenceFrequency = "weekly"
	RecurrenceFrequencyMonthly RecurrenceFrequency = "monthly"
)

type RecurrenceRule struct {
	ID          uint                `gorm:"primaryKey"`
	FamilyID    uint                `gorm:"not null;index"`
	CreatedBy   uint                `gorm:"not null"`
	Title       string              `gorm:"not null"`
	Category    *string
	Frequency   RecurrenceFrequency `gorm:"not null"`
	DayOfWeek   *int8               // 0=日〜6=土 (weekly / monthly曜日指定)
	DayOfMonth  *int8               // 1〜31 (monthly 日付指定)
	WeekOfMonth *int8               // 第N週 1〜5 (monthly 曜日指定)
	StartDate   time.Time           `gorm:"not null"`
	EndDate     *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time

	Family  *Family `gorm:"foreignKey:FamilyID"`
	Creator *User   `gorm:"foreignKey:CreatedBy"`
}
