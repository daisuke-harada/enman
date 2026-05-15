package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type GetFamilyTimelineInputPort interface {
	Execute(ctx context.Context, input GetFamilyTimelineInput) (*GetFamilyTimelineOutput, error)
}

type GetFamilyTimelineInput struct {
	CurrentUserID uint
}

type GetFamilyTimelineOutput struct {
	Appreciations []*model.Appreciation
}

type GetFamilyTimelineInteractor struct {
	UserRepo         repository.UserRepository
	AppreciationRepo repository.AppreciationRepository
}

func NewGetFamilyTimelineInteractor(userRepo repository.UserRepository, appreciationRepo repository.AppreciationRepository) *GetFamilyTimelineInteractor {
	return &GetFamilyTimelineInteractor{UserRepo: userRepo, AppreciationRepo: appreciationRepo}
}

func (i *GetFamilyTimelineInteractor) Execute(ctx context.Context, input GetFamilyTimelineInput) (*GetFamilyTimelineOutput, error) {
	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.Forbidden("家族グループに参加していません")
	}

	appreciations, err := i.AppreciationRepo.FindByFamilyID(ctx, *user.FamilyID)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}
	return &GetFamilyTimelineOutput{Appreciations: appreciations}, nil
}
