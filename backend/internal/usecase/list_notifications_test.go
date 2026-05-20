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

func TestListNotificationsInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	t.Run("正常取得", func(t *testing.T) {
		mockRepo := repositorymock.NewMockAppreciationRepository(ctrl)
		msg := "ありがとう"
		mockRepo.EXPECT().FindByToUserID(ctx, uint(10)).Return([]*model.Appreciation{
			{ID: 1, ToUserID: 10, Message: &msg},
		}, nil)

		interactor := usecase.NewListNotificationsInteractor(mockRepo)
		out, err := interactor.Execute(ctx, usecase.ListNotificationsInput{CurrentUserID: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Appreciations) != 1 {
			t.Errorf("want 1 appreciation, got %d", len(out.Appreciations))
		}
	})

	t.Run("通知なしは空スライス", func(t *testing.T) {
		mockRepo := repositorymock.NewMockAppreciationRepository(ctrl)
		mockRepo.EXPECT().FindByToUserID(ctx, uint(10)).Return([]*model.Appreciation{}, nil)

		interactor := usecase.NewListNotificationsInteractor(mockRepo)
		out, err := interactor.Execute(ctx, usecase.ListNotificationsInput{CurrentUserID: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Appreciations) != 0 {
			t.Errorf("want 0 appreciations, got %d", len(out.Appreciations))
		}
	})

	t.Run("DB エラーはInternalServerError", func(t *testing.T) {
		mockRepo := repositorymock.NewMockAppreciationRepository(ctrl)
		mockRepo.EXPECT().FindByToUserID(ctx, uint(10)).Return(nil, errors.New("db error"))

		interactor := usecase.NewListNotificationsInteractor(mockRepo)
		_, err := interactor.Execute(ctx, usecase.ListNotificationsInput{CurrentUserID: 10})
		if err == nil {
			t.Error("expected InternalServerError")
		}
	})
}
