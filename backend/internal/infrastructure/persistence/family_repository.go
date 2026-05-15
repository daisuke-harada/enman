package persistence

import (
	"context"
	"errors"

	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	"gorm.io/gorm"
)

type familyRepository struct {
	db *gorm.DB
}

func NewFamilyRepository(db *gorm.DB) repository.FamilyRepository {
	return &familyRepository{db: db}
}

func (r *familyRepository) Create(ctx context.Context, family *model.Family) error {
	return r.db.WithContext(ctx).Create(family).Error
}

func (r *familyRepository) FindByInviteCode(ctx context.Context, inviteCode string) (*model.Family, error) {
	var family model.Family
	err := r.db.WithContext(ctx).Where("invite_code = ?", inviteCode).First(&family).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &family, err
}
