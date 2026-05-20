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

func TestGetFamilyTimelineInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("正常取得", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockAppreciationRepo := repositorymock.NewMockAppreciationRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		msg1, msg2 := "ありがとう", "お疲れ様"
		mockAppreciationRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.Appreciation{
			{ID: 1, Message: &msg1},
			{ID: 2, Message: &msg2},
		}, nil)

		interactor := usecase.NewGetFamilyTimelineInteractor(mockUserRepo, mockAppreciationRepo)
		out, err := interactor.Execute(ctx, usecase.GetFamilyTimelineInput{CurrentUserID: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Appreciations) != 2 {
			t.Errorf("want 2 appreciations, got %d", len(out.Appreciations))
		}
	})

	t.Run("家族未参加はForbidden", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockAppreciationRepo := repositorymock.NewMockAppreciationRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: nil}, nil)

		interactor := usecase.NewGetFamilyTimelineInteractor(mockUserRepo, mockAppreciationRepo)
		_, err := interactor.Execute(ctx, usecase.GetFamilyTimelineInput{CurrentUserID: 10})
		if err == nil {
			t.Error("expected Forbidden error")
		}
	})

	t.Run("AppreciationリポジトリエラーはInternalServerError", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockAppreciationRepo := repositorymock.NewMockAppreciationRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockAppreciationRepo.EXPECT().FindByFamilyID(ctx, familyID).Return(nil, errors.New("db error"))

		interactor := usecase.NewGetFamilyTimelineInteractor(mockUserRepo, mockAppreciationRepo)
		_, err := interactor.Execute(ctx, usecase.GetFamilyTimelineInput{CurrentUserID: 10})
		if err == nil {
			t.Error("expected InternalServerError")
		}
	})
}
