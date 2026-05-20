package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestRefreshAccessTokenInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	jwtSecret := "test-secret-key"

	t.Run("正常リフレッシュ", func(t *testing.T) {
		mockRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)
		// hashToken はパッケージ内部関数のため gomock.Any() でマッチング
		mockRepo.EXPECT().FindByTokenHash(ctx, gomock.Any()).Return(&model.RefreshToken{
			ID:        1,
			UserID:    10,
			TokenHash: "hashed",
			ExpiredAt: time.Now().Add(24 * time.Hour),
		}, nil)
		mockRepo.EXPECT().DeleteByTokenHash(ctx, gomock.Any()).Return(nil)
		mockRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewRefreshAccessTokenInteractor(mockRepo)
		out, err := interactor.Execute(ctx, usecase.RefreshAccessTokenInput{
			RefreshToken: "valid-refresh-token",
			JWTSecret:    jwtSecret,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.AccessToken == "" {
			t.Error("expected non-empty access token")
		}
		if out.RefreshToken == "" {
			t.Error("expected non-empty refresh token")
		}
	})

	t.Run("リフレッシュトークン空はバリデーションエラー", func(t *testing.T) {
		mockRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)

		interactor := usecase.NewRefreshAccessTokenInteractor(mockRepo)
		_, err := interactor.Execute(ctx, usecase.RefreshAccessTokenInput{
			RefreshToken: "",
			JWTSecret:    jwtSecret,
		})
		if err == nil {
			t.Error("expected validation error")
		}
	})

	t.Run("存在しないトークンはUnauthorized", func(t *testing.T) {
		mockRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)
		mockRepo.EXPECT().FindByTokenHash(ctx, gomock.Any()).Return(nil, errors.New("not found"))

		interactor := usecase.NewRefreshAccessTokenInteractor(mockRepo)
		_, err := interactor.Execute(ctx, usecase.RefreshAccessTokenInput{
			RefreshToken: "invalid-token",
			JWTSecret:    jwtSecret,
		})
		if err == nil {
			t.Error("expected Unauthorized error")
		}
	})

	t.Run("期限切れトークンはUnauthorized", func(t *testing.T) {
		mockRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)
		mockRepo.EXPECT().FindByTokenHash(ctx, gomock.Any()).Return(&model.RefreshToken{
			ID:        1,
			UserID:    10,
			TokenHash: "hashed",
			ExpiredAt: time.Now().Add(-1 * time.Hour),
		}, nil)
		mockRepo.EXPECT().DeleteByTokenHash(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewRefreshAccessTokenInteractor(mockRepo)
		_, err := interactor.Execute(ctx, usecase.RefreshAccessTokenInput{
			RefreshToken: "expired-token",
			JWTSecret:    jwtSecret,
		})
		if err == nil {
			t.Error("expected Unauthorized error for expired token")
		}
	})
}
