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

func TestGetCurrentUserInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	t.Run("正常取得", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, Name: "田中太郎"}, nil)

		interactor := usecase.NewGetCurrentUserInteractor(mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.GetCurrentUserInput{UserID: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.User.ID != 10 {
			t.Errorf("want ID=10, got %d", out.User.ID)
		}
		if out.User.Name != "田中太郎" {
			t.Errorf("want Name=田中太郎, got %s", out.User.Name)
		}
	})

	t.Run("存在しないユーザーはNotFound", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(99)).Return(nil, errors.New("not found"))

		interactor := usecase.NewGetCurrentUserInteractor(mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.GetCurrentUserInput{UserID: 99})
		if err == nil {
			t.Error("expected NotFound error")
		}
	})
}
