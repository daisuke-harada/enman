package persistence

import (
	"context"

	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	"gorm.io/gorm"
)

type appreciationRepository struct {
	db *gorm.DB
}

func NewAppreciationRepository(db *gorm.DB) repository.AppreciationRepository {
	return &appreciationRepository{db: db}
}

func (r *appreciationRepository) Create(ctx context.Context, appreciation *model.Appreciation) error {
	return r.db.WithContext(ctx).Create(appreciation).Error
}

func (r *appreciationRepository) FindByToUserID(ctx context.Context, toUserID uint) ([]*model.Appreciation, error) {
	var appreciations []*model.Appreciation
	err := r.db.WithContext(ctx).
		Preload("Task").
		Preload("FromUser").
		Where("to_user_id = ?", toUserID).
		Order("created_at DESC").
		Find(&appreciations).Error
	if err != nil {
		return nil, err
	}
	return appreciations, nil
}

func (r *appreciationRepository) FindByFamilyID(ctx context.Context, familyID uint) ([]*model.Appreciation, error) {
	var appreciations []*model.Appreciation
	err := r.db.WithContext(ctx).
		Preload("Task").
		Preload("FromUser").
		Preload("ToUser").
		Joins("JOIN tasks ON tasks.id = appreciations.task_id").
		Where("tasks.family_id = ?", familyID).
		Order("appreciations.created_at DESC").
		Find(&appreciations).Error
	if err != nil {
		return nil, err
	}
	return appreciations, nil
}
