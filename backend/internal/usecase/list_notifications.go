package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type ListNotificationsInputPort interface {
	Execute(ctx context.Context, input ListNotificationsInput) (*ListNotificationsOutput, error)
}

type ListNotificationsInput struct {
	CurrentUserID uint
}

type ListNotificationsOutput struct {
	Appreciations []*model.Appreciation
}

type ListNotificationsInteractor struct {
	AppreciationRepo repository.AppreciationRepository
}

func NewListNotificationsInteractor(appreciationRepo repository.AppreciationRepository) *ListNotificationsInteractor {
	return &ListNotificationsInteractor{AppreciationRepo: appreciationRepo}
}

func (i *ListNotificationsInteractor) Execute(ctx context.Context, input ListNotificationsInput) (*ListNotificationsOutput, error) {
	appreciations, err := i.AppreciationRepo.FindByToUserID(ctx, input.CurrentUserID)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}
	return &ListNotificationsOutput{Appreciations: appreciations}, nil
}
