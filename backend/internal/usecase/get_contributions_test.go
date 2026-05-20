package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestGetContributionsInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("正常取得", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockStatsRepo := repositorymock.NewMockStatsRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockStatsRepo.EXPECT().GetContributions(ctx, familyID).Return([]*repository.ContributionItem{
			{UserID: 10, UserName: "田中太郎", Count: 5},
		}, nil)

		interactor := usecase.NewGetContributionsInteractor(mockUserRepo, mockStatsRepo)
		out, err := interactor.Execute(ctx, usecase.GetContributionsInput{CurrentUserID: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Items) != 1 {
			t.Errorf("want 1 item, got %d", len(out.Items))
		}
	})

	t.Run("家族未参加はForbidden", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockStatsRepo := repositorymock.NewMockStatsRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: nil}, nil)

		interactor := usecase.NewGetContributionsInteractor(mockUserRepo, mockStatsRepo)
		_, err := interactor.Execute(ctx, usecase.GetContributionsInput{CurrentUserID: 10})
		if err == nil {
			t.Error("expected Forbidden error")
		}
	})

	t.Run("StatsリポジトリエラーはInternalServerError", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockStatsRepo := repositorymock.NewMockStatsRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockStatsRepo.EXPECT().GetContributions(ctx, familyID).Return(nil, errors.New("db error"))

		interactor := usecase.NewGetContributionsInteractor(mockUserRepo, mockStatsRepo)
		_, err := interactor.Execute(ctx, usecase.GetContributionsInput{CurrentUserID: 10})
		if err == nil {
			t.Error("expected InternalServerError")
		}
	})
}
