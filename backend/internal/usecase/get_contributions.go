package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type GetContributionsInputPort interface {
	Execute(ctx context.Context, input GetContributionsInput) (*GetContributionsOutput, error)
}

type GetContributionsInput struct {
	CurrentUserID uint
}

type GetContributionsOutput struct {
	Items []*repository.ContributionItem
}

type GetContributionsInteractor struct {
	UserRepo  repository.UserRepository
	StatsRepo repository.StatsRepository
}

func NewGetContributionsInteractor(userRepo repository.UserRepository, statsRepo repository.StatsRepository) *GetContributionsInteractor {
	return &GetContributionsInteractor{UserRepo: userRepo, StatsRepo: statsRepo}
}

func (i *GetContributionsInteractor) Execute(ctx context.Context, input GetContributionsInput) (*GetContributionsOutput, error) {
	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.Forbidden("家族グループに参加していません")
	}

	items, err := i.StatsRepo.GetContributions(ctx, *user.FamilyID)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}
	return &GetContributionsOutput{Items: items}, nil
}
