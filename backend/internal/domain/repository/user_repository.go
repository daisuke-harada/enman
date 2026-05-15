package repository

import (
	"context"

	"github.com/daisuke-harada/enman/internal/domain/model"
)

type UserRepository interface {
	Create(ctx context.Context, user *model.User) error
	FindByID(ctx context.Context, id uint) (*model.User, error)
	FindByEmail(ctx context.Context, email string) (*model.User, error)
	FindByFamilyID(ctx context.Context, familyID uint) ([]*model.User, error)
	Update(ctx context.Context, user *model.User) error
}
