package repository

import (
	"context"

	"github.com/daisuke-harada/enman/internal/domain/model"
)

type RecurrenceRuleRepository interface {
	Create(ctx context.Context, rule *model.RecurrenceRule) error
	FindByID(ctx context.Context, id uint) (*model.RecurrenceRule, error)
	FindByFamilyID(ctx context.Context, familyID uint) ([]*model.RecurrenceRule, error)
	Update(ctx context.Context, rule *model.RecurrenceRule) error
	Delete(ctx context.Context, id uint) error
}
