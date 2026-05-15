package repository

import (
	"context"

	"github.com/daisuke-harada/enman/internal/domain/model"
)

type AppreciationRepository interface {
	Create(ctx context.Context, appreciation *model.Appreciation) error
	FindByToUserID(ctx context.Context, toUserID uint) ([]*model.Appreciation, error)
}
