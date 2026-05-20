package persistence

import (
	"context"
	"errors"

	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	"gorm.io/gorm"
)

type recurrenceRuleRepository struct {
	db *gorm.DB
}

func NewRecurrenceRuleRepository(db *gorm.DB) repository.RecurrenceRuleRepository {
	return &recurrenceRuleRepository{db: db}
}

func (r *recurrenceRuleRepository) Create(ctx context.Context, rule *model.RecurrenceRule) error {
	return r.db.WithContext(ctx).Create(rule).Error
}

func (r *recurrenceRuleRepository) FindByID(ctx context.Context, id uint) (*model.RecurrenceRule, error) {
	var rule model.RecurrenceRule
	err := r.db.WithContext(ctx).First(&rule, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &rule, err
}

func (r *recurrenceRuleRepository) FindByFamilyID(ctx context.Context, familyID uint) ([]*model.RecurrenceRule, error) {
	var rules []*model.RecurrenceRule
	if err := r.db.WithContext(ctx).
		Where("family_id = ?", familyID).
		Order("created_at DESC").
		Find(&rules).Error; err != nil {
		return nil, err
	}
	return rules, nil
}

func (r *recurrenceRuleRepository) Update(ctx context.Context, rule *model.RecurrenceRule) error {
	return r.db.WithContext(ctx).Save(rule).Error
}

func (r *recurrenceRuleRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.RecurrenceRule{}, id).Error
}
