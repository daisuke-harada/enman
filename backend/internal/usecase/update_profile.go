package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type UpdateProfileInputPort interface {
	Execute(ctx context.Context, input UpdateProfileInput) (*UpdateProfileOutput, error)
}

type UpdateProfileInput struct {
	UserID  uint
	Name    *string
	Role    *string
	IconURL *string
}

type UpdateProfileOutput struct {
	User *model.User
}

type UpdateProfileInteractor struct {
	UserRepo repository.UserRepository
}

func NewUpdateProfileInteractor(userRepo repository.UserRepository) *UpdateProfileInteractor {
	return &UpdateProfileInteractor{UserRepo: userRepo}
}

func (i *UpdateProfileInteractor) Execute(ctx context.Context, input UpdateProfileInput) (*UpdateProfileOutput, error) {
	user, err := i.UserRepo.FindByID(ctx, input.UserID)
	if err != nil {
		return nil, apperror.NotFound("ユーザーが見つかりません")
	}

	if input.Name != nil {
		user.Name = *input.Name
	}
	if input.Role != nil {
		user.Role = *input.Role
	}
	if input.IconURL != nil {
		user.IconURL = input.IconURL
	}

	if err := i.UserRepo.Update(ctx, user); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &UpdateProfileOutput{User: user}, nil
}
