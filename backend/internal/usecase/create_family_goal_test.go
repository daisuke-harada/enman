package usecase_test

import (
	"context"
	"testing"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestCreateFamilyGoalInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("正常作成", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockGoalRepo := repositorymock.NewMockFamilyGoalRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID, EnmanPoint: 40}, nil)
		mockUserRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.User{
			{ID: 10, EnmanPoint: 40},
			{ID: 11, EnmanPoint: 10},
		}, nil)
		mockGoalRepo.EXPECT().Create(ctx, gomock.Any()).DoAndReturn(func(_ context.Context, g *model.FamilyGoal) error {
			g.ID = 1
			return nil
		})

		interactor := usecase.NewCreateFamilyGoalInteractor(mockUserRepo, mockGoalRepo)
		out, err := interactor.Execute(ctx, usecase.CreateFamilyGoalInput{
			CurrentUserID: 10,
			Title:         "家族旅行",
			TargetPoints:  100,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Goal.Title != "家族旅行" {
			t.Errorf("want Title=家族旅行, got %s", out.Goal.Title)
		}
		if out.CurrentPoints != 50 {
			t.Errorf("want CurrentPoints=50, got %d", out.CurrentPoints)
		}
	})

	t.Run("タイトル空はバリデーションエラー", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockGoalRepo := repositorymock.NewMockFamilyGoalRepository(ctrl)

		interactor := usecase.NewCreateFamilyGoalInteractor(mockUserRepo, mockGoalRepo)
		_, err := interactor.Execute(ctx, usecase.CreateFamilyGoalInput{
			CurrentUserID: 10,
			Title:         "",
			TargetPoints:  100,
		})
		if err == nil {
			t.Error("expected validation error for empty title")
		}
	})

	t.Run("TargetPoints=0はバリデーションエラー", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockGoalRepo := repositorymock.NewMockFamilyGoalRepository(ctrl)

		interactor := usecase.NewCreateFamilyGoalInteractor(mockUserRepo, mockGoalRepo)
		_, err := interactor.Execute(ctx, usecase.CreateFamilyGoalInput{
			CurrentUserID: 10,
			Title:         "旅行",
			TargetPoints:  0,
		})
		if err == nil {
			t.Error("expected validation error for zero target points")
		}
	})

	t.Run("家族未参加はForbidden", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockGoalRepo := repositorymock.NewMockFamilyGoalRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: nil}, nil)

		interactor := usecase.NewCreateFamilyGoalInteractor(mockUserRepo, mockGoalRepo)
		_, err := interactor.Execute(ctx, usecase.CreateFamilyGoalInput{
			CurrentUserID: 10,
			Title:         "旅行",
			TargetPoints:  100,
		})
		if err == nil {
			t.Error("expected Forbidden error")
		}
	})
}
