package usecase_test

import (
	"context"
	"testing"

	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestLogoutUserInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	t.Run("正常ログアウト", func(t *testing.T) {
		mockRefreshTokenRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)
		mockRefreshTokenRepo.EXPECT().DeleteByTokenHash(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewLogoutUserInteractor(mockRefreshTokenRepo)
		err := interactor.Execute(ctx, usecase.LogoutUserInput{RefreshToken: "valid-token-string"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("リフレッシュトークン空はバリデーションエラー", func(t *testing.T) {
		mockRefreshTokenRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)

		interactor := usecase.NewLogoutUserInteractor(mockRefreshTokenRepo)
		err := interactor.Execute(ctx, usecase.LogoutUserInput{RefreshToken: ""})
		if err == nil {
			t.Error("expected validation error")
		}
	})

	t.Run("DeleteByTokenHashが失敗してもエラーを無視する", func(t *testing.T) {
		mockRefreshTokenRepo := repositorymock.NewMockRefreshTokenRepository(ctrl)
		mockRefreshTokenRepo.EXPECT().DeleteByTokenHash(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewLogoutUserInteractor(mockRefreshTokenRepo)
		err := interactor.Execute(ctx, usecase.LogoutUserInput{RefreshToken: "some-token"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})
}
