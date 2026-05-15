package usecase_test

import (
	"context"
	"testing"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestRegisterUserInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	ctx := context.Background()
	jwtSecret := "test-secret-32-chars-long-enough!"

	t.Run("正常登録", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockRTRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)
		mockUserRepo.EXPECT().FindByEmail(ctx, "taro@example.com").Return(nil, nil)
		mockUserRepo.EXPECT().Create(ctx, gomock.Any()).DoAndReturn(func(_ context.Context, u *model.User) error {
			u.ID = 1
			return nil
		})
		mockRTRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewRegisterUserInteractor(mockUserRepo, mockRTRepo)
		out, err := interactor.Execute(ctx, usecase.RegisterUserInput{
			Name:      "田中太郎",
			Email:     "taro@example.com",
			Password:  "password123",
			Role:      "パパ",
			JWTSecret: jwtSecret,
		})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.User.Name != "田中太郎" {
			t.Errorf("want Name=田中太郎, got %s", out.User.Name)
		}
		if out.AccessToken == "" {
			t.Error("AccessToken should not be empty")
		}
	})

	t.Run("パスワード短すぎ", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockRTRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)
		interactor := usecase.NewRegisterUserInteractor(mockUserRepo, mockRTRepo)
		_, err := interactor.Execute(ctx, usecase.RegisterUserInput{
			Name:      "田中太郎",
			Email:     "taro@example.com",
			Password:  "short",
			Role:      "パパ",
			JWTSecret: jwtSecret,
		})
		if err == nil {
			t.Error("expected validation error")
		}
	})

	t.Run("メールアドレス重複", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockRTRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)
		mockUserRepo.EXPECT().FindByEmail(ctx, "taro@example.com").Return(&model.User{ID: 99}, nil)

		interactor := usecase.NewRegisterUserInteractor(mockUserRepo, mockRTRepo)
		_, err := interactor.Execute(ctx, usecase.RegisterUserInput{
			Name:      "田中太郎",
			Email:     "taro@example.com",
			Password:  "password123",
			Role:      "パパ",
			JWTSecret: jwtSecret,
		})
		if err == nil {
			t.Error("expected duplicate email error")
		}
	})
}
