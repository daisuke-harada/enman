package repository

import (
	"context"

	"github.com/daisuke-harada/enman/internal/domain/model"
)

type FamilyGoalRepository interface {
	Create(ctx context.Context, goal *model.FamilyGoal) error
	FindByFamilyID(ctx context.Context, familyID uint) ([]*model.FamilyGoal, error)
}
