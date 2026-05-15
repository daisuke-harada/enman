package usecase

import (
	"context"
	"strings"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type CreateFamilyGoalInputPort interface {
	Execute(ctx context.Context, input CreateFamilyGoalInput) (*CreateFamilyGoalOutput, error)
}

type CreateFamilyGoalInput struct {
	CurrentUserID uint
	Title         string
	TargetPoints  int
}

func (i *CreateFamilyGoalInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.Title) == "" {
		errs = append(errs, "目標タイトルを入力してください")
	}
	if i.TargetPoints <= 0 {
		errs = append(errs, "目標ポイントは1以上で入力してください")
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type CreateFamilyGoalOutput struct {
	Goal          *model.FamilyGoal
	CurrentPoints int
}

type CreateFamilyGoalInteractor struct {
	UserRepo       repository.UserRepository
	FamilyGoalRepo repository.FamilyGoalRepository
}

func NewCreateFamilyGoalInteractor(userRepo repository.UserRepository, familyGoalRepo repository.FamilyGoalRepository) *CreateFamilyGoalInteractor {
	return &CreateFamilyGoalInteractor{UserRepo: userRepo, FamilyGoalRepo: familyGoalRepo}
}

func (i *CreateFamilyGoalInteractor) Execute(ctx context.Context, input CreateFamilyGoalInput) (*CreateFamilyGoalOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil || user.FamilyID == nil {
		return nil, apperror.Forbidden("家族グループに参加していません")
	}

	members, err := i.UserRepo.FindByFamilyID(ctx, *user.FamilyID)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}
	totalPoints := 0
	for _, m := range members {
		totalPoints += m.EnmanPoint
	}

	goal := &model.FamilyGoal{
		FamilyID:     *user.FamilyID,
		Title:        input.Title,
		TargetPoints: input.TargetPoints,
	}
	if err := i.FamilyGoalRepo.Create(ctx, goal); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &CreateFamilyGoalOutput{Goal: goal, CurrentPoints: totalPoints}, nil
}
