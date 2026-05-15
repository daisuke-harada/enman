package persistence

import (
	"context"
	"errors"

	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) repository.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *model.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) FindByID(ctx context.Context, id uint) (*model.User, error) {
	var user model.User
	err := r.db.WithContext(ctx).First(&user, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &user, err
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	var user model.User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &user, err
}

func (r *userRepository) FindByFamilyID(ctx context.Context, familyID uint) ([]*model.User, error) {
	var users []*model.User
	if err := r.db.WithContext(ctx).Where("family_id = ?", familyID).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) Update(ctx context.Context, user *model.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}
