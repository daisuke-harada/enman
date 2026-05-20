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

func TestListTaskTemplatesInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	t.Run("正常取得", func(t *testing.T) {
		mockRepo := repositorymock.NewMockTaskTemplateRepository(ctrl)
		mockRepo.EXPECT().FindAll(ctx).Return([]*model.TaskTemplate{
			{ID: 1, Name: "皿洗い"},
			{ID: 2, Name: "掃除機"},
		}, nil)

		interactor := usecase.NewListTaskTemplatesInteractor(mockRepo)
		out, err := interactor.Execute(ctx)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Templates) != 2 {
			t.Errorf("want 2 templates, got %d", len(out.Templates))
		}
	})

	t.Run("DB エラーはInternalServerError", func(t *testing.T) {
		mockRepo := repositorymock.NewMockTaskTemplateRepository(ctrl)
		mockRepo.EXPECT().FindAll(ctx).Return(nil, errors.New("db error"))

		interactor := usecase.NewListTaskTemplatesInteractor(mockRepo)
		_, err := interactor.Execute(ctx)
		if err == nil {
			t.Error("expected InternalServerError")
		}
	})
}
