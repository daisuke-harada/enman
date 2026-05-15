package usecase_test

import (
	"context"
	"testing"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
	"golang.org/x/crypto/bcrypt"
)

func TestLoginUserInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	ctx := context.Background()
	jwtSecret := "test-secret-32-chars-long-enough!"

	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	existingUser := &model.User{ID: 1, Email: "taro@example.com", PasswordDigest: string(hash)}

	t.Run("正常ログイン", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockRTRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)
		mockUserRepo.EXPECT().FindByEmail(ctx, "taro@example.com").Return(existingUser, nil)
		mockRTRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewLoginUserInteractor(mockUserRepo, mockRTRepo)
		out, err := interactor.Execute(ctx, usecase.LoginUserInput{
			Email:     "taro@example.com",
			Password:  "password123",
			JWTSecret: jwtSecret,
		})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.AccessToken == "" || out.RefreshToken == "" {
			t.Error("tokens should not be empty")
		}
	})

	t.Run("パスワード不一致", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockRTRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)
		mockUserRepo.EXPECT().FindByEmail(ctx, "taro@example.com").Return(existingUser, nil)

		interactor := usecase.NewLoginUserInteractor(mockUserRepo, mockRTRepo)
		_, err := interactor.Execute(ctx, usecase.LoginUserInput{
			Email:     "taro@example.com",
			Password:  "wrongpassword",
			JWTSecret: jwtSecret,
		})
		if err == nil {
			t.Error("expected error for wrong password")
		}
	})
}
