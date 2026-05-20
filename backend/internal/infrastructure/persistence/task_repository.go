package persistence

import (
	"context"
	"errors"
	"time"

	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	"gorm.io/gorm"
)

type taskRepository struct {
	db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) repository.TaskRepository {
	return &taskRepository{db: db}
}

func (r *taskRepository) Create(ctx context.Context, task *model.Task) error {
	return r.db.WithContext(ctx).Create(task).Error
}

func (r *taskRepository) FindByID(ctx context.Context, id uint) (*model.Task, error) {
	var task model.Task
	err := r.db.WithContext(ctx).First(&task, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &task, err
}

func (r *taskRepository) Search(ctx context.Context, params repository.TaskSearchParams) ([]*model.Task, error) {
	db := r.db.WithContext(ctx).Model(&model.Task{})

	if params.FamilyID != nil {
		db = db.Where("family_id = ?", *params.FamilyID)
	}
	if params.Status != nil {
		db = db.Where("status = ?", *params.Status)
	}
	if params.DoneOnDate != nil {
		today := params.DoneOnDate
		startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)
		db = db.Where("done_at >= ? AND done_at < ?", startOfDay, endOfDay)
	}
	if params.ScheduledMonthStart != nil && params.ScheduledMonthEnd != nil {
		db = db.Where("scheduled_date >= ? AND scheduled_date < ?", *params.ScheduledMonthStart, *params.ScheduledMonthEnd)
	}

	var tasks []*model.Task
	if err := db.Preload("Appreciations.FromUser").Order("created_at DESC").Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepository) Update(ctx context.Context, task *model.Task) error {
	return r.db.WithContext(ctx).Save(task).Error
}

func (r *taskRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.Task{}, id).Error
}

type taskTemplateRepository struct {
	db *gorm.DB
}

func NewTaskTemplateRepository(db *gorm.DB) repository.TaskTemplateRepository {
	return &taskTemplateRepository{db: db}
}

func (r *taskTemplateRepository) FindAll(ctx context.Context) ([]*model.TaskTemplate, error) {
	var templates []*model.TaskTemplate
	if err := r.db.WithContext(ctx).Order("category, name").Find(&templates).Error; err != nil {
		return nil, err
	}
	return templates, nil
}
