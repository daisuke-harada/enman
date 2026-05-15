package repository

import (
	"context"

	"github.com/daisuke-harada/enman/internal/domain/model"
)

type FamilyRepository interface {
	Create(ctx context.Context, family *model.Family) error
	FindByInviteCode(ctx context.Context, inviteCode string) (*model.Family, error)
}
