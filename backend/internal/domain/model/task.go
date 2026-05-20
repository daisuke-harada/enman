package model

import "time"

type TaskStatus string

const (
	TaskStatusPending TaskStatus = "pending"
	TaskStatusDone    TaskStatus = "done"
)

type Task struct {
	ID               uint       `gorm:"primaryKey"`
	FamilyID         uint       `gorm:"not null;index"`
	CreatedBy        uint       `gorm:"not null"`
	DoneBy           *uint
	Title            string     `gorm:"not null"`
	Category         *string
	Status           TaskStatus `gorm:"not null;default:'pending'"`
	DoneAt           *time.Time
	RecurrenceRuleID *uint
	ScheduledDate    *time.Time
	CreatedAt        time.Time
	UpdatedAt        time.Time

	Family          *Family          `gorm:"foreignKey:FamilyID"`
	Creator         *User            `gorm:"foreignKey:CreatedBy"`
	Doer            *User            `gorm:"foreignKey:DoneBy"`
	RecurrenceRule  *RecurrenceRule  `gorm:"foreignKey:RecurrenceRuleID"`
	Appreciations   []*Appreciation  `gorm:"foreignKey:TaskID"`
}

type TaskTemplate struct {
	ID       uint   `gorm:"primaryKey"`
	Name     string `gorm:"not null"`
	Category string `gorm:"not null"`
}
