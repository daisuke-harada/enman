package persistence

import (
	"context"

	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	"gorm.io/gorm"
)

type familyGoalRepository struct {
	db *gorm.DB
}

func NewFamilyGoalRepository(db *gorm.DB) repository.FamilyGoalRepository {
	return &familyGoalRepository{db: db}
}

func (r *familyGoalRepository) Create(ctx context.Context, goal *model.FamilyGoal) error {
	return r.db.WithContext(ctx).Create(goal).Error
}

func (r *familyGoalRepository) FindByFamilyID(ctx context.Context, familyID uint) ([]*model.FamilyGoal, error) {
	var goals []*model.FamilyGoal
	if err := r.db.WithContext(ctx).Where("family_id = ?", familyID).Order("created_at DESC").Find(&goals).Error; err != nil {
		return nil, err
	}
	return goals, nil
}
