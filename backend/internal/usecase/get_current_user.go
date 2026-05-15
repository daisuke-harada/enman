package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type GetCurrentUserInputPort interface {
	Execute(ctx context.Context, input GetCurrentUserInput) (*GetCurrentUserOutput, error)
}

type GetCurrentUserInput struct {
	UserID uint
}

type GetCurrentUserOutput struct {
	User *model.User
}

type GetCurrentUserInteractor struct {
	UserRepo repository.UserRepository
}

func NewGetCurrentUserInteractor(userRepo repository.UserRepository) *GetCurrentUserInteractor {
	return &GetCurrentUserInteractor{UserRepo: userRepo}
}

func (i *GetCurrentUserInteractor) Execute(ctx context.Context, input GetCurrentUserInput) (*GetCurrentUserOutput, error) {
	user, err := i.UserRepo.FindByID(ctx, input.UserID)
	if err != nil {
		return nil, apperror.NotFound("ユーザーが見つかりません")
	}
	return &GetCurrentUserOutput{User: user}, nil
}
