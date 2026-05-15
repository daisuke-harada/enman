package usecase

import (
	"context"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type ListFamilyGoalsInputPort interface {
	Execute(ctx context.Context, input ListFamilyGoalsInput) (*ListFamilyGoalsOutput, error)
}

type ListFamilyGoalsInput struct {
	CurrentUserID uint
}

type FamilyGoalWithPoints struct {
	Goal          *model.FamilyGoal
	CurrentPoints int
}

type ListFamilyGoalsOutput struct {
	Goals         []*FamilyGoalWithPoints
}

type ListFamilyGoalsInteractor struct {
	UserRepo     repository.UserRepository
	FamilyGoalRepo repository.FamilyGoalRepository
}

func NewListFamilyGoalsInteractor(userRepo repository.UserRepository, familyGoalRepo repository.FamilyGoalRepository) *ListFamilyGoalsInteractor {
	return &ListFamilyGoalsInteractor{UserRepo: userRepo, FamilyGoalRepo: familyGoalRepo}
}

func (i *ListFamilyGoalsInteractor) Execute(ctx context.Context, input ListFamilyGoalsInput) (*ListFamilyGoalsOutput, error) {
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

	goals, err := i.FamilyGoalRepo.FindByFamilyID(ctx, *user.FamilyID)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	result := make([]*FamilyGoalWithPoints, len(goals))
	for idx, g := range goals {
		result[idx] = &FamilyGoalWithPoints{Goal: g, CurrentPoints: totalPoints}
	}
	return &ListFamilyGoalsOutput{Goals: result}, nil
}
