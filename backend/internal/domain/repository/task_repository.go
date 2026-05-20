package repository

import (
	"context"
	"time"

	"github.com/daisuke-harada/enman/internal/domain/model"
)

type TaskSearchParams struct {
	FamilyID            *uint
	Status              *model.TaskStatus
	DoneOnDate          *time.Time
	ScheduledMonthStart *time.Time
	ScheduledMonthEnd   *time.Time
}

type TaskRepository interface {
	Create(ctx context.Context, task *model.Task) error
	FindByID(ctx context.Context, id uint) (*model.Task, error)
	Search(ctx context.Context, params TaskSearchParams) ([]*model.Task, error)
	Update(ctx context.Context, task *model.Task) error
	Delete(ctx context.Context, id uint) error
}

type TaskTemplateRepository interface {
	FindAll(ctx context.Context) ([]*model.TaskTemplate, error)
}
