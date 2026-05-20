package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestListFamilyGoalsInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("正常取得・ポイント集計", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockGoalRepo := repositorymock.NewMockFamilyGoalRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockUserRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.User{
			{ID: 10, EnmanPoint: 30},
			{ID: 11, EnmanPoint: 20},
		}, nil)
		mockGoalRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.FamilyGoal{
			{ID: 1, Title: "旅行", TargetPoints: 100},
		}, nil)

		interactor := usecase.NewListFamilyGoalsInteractor(mockUserRepo, mockGoalRepo)
		out, err := interactor.Execute(ctx, usecase.ListFamilyGoalsInput{CurrentUserID: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Goals) != 1 {
			t.Errorf("want 1 goal, got %d", len(out.Goals))
		}
		if out.Goals[0].CurrentPoints != 50 {
			t.Errorf("want CurrentPoints=50, got %d", out.Goals[0].CurrentPoints)
		}
	})

	t.Run("家族未参加はForbidden", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockGoalRepo := repositorymock.NewMockFamilyGoalRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: nil}, nil)

		interactor := usecase.NewListFamilyGoalsInteractor(mockUserRepo, mockGoalRepo)
		_, err := interactor.Execute(ctx, usecase.ListFamilyGoalsInput{CurrentUserID: 10})
		if err == nil {
			t.Error("expected Forbidden error")
		}
	})

	t.Run("GoalリポジトリエラーはInternalServerError", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockGoalRepo := repositorymock.NewMockFamilyGoalRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockUserRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.User{{ID: 10, EnmanPoint: 10}}, nil)
		mockGoalRepo.EXPECT().FindByFamilyID(ctx, familyID).Return(nil, errors.New("db error"))

		interactor := usecase.NewListFamilyGoalsInteractor(mockUserRepo, mockGoalRepo)
		_, err := interactor.Execute(ctx, usecase.ListFamilyGoalsInput{CurrentUserID: 10})
		if err == nil {
			t.Error("expected InternalServerError")
		}
	})
}
