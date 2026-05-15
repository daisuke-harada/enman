package usecase_test

import (
	"context"
	"testing"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestCreateTaskInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("正常作成", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().Create(ctx, gomock.Any()).DoAndReturn(func(_ context.Context, t *model.Task) error {
			t.ID = 1
			return nil
		})

		interactor := usecase.NewCreateTaskInteractor(mockTaskRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.CreateTaskInput{
			Title:         "皿洗い",
			CurrentUserID: 10,
		})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Task.Title != "皿洗い" {
			t.Errorf("want Title=皿洗い, got %s", out.Task.Title)
		}
		if out.Task.Status != model.TaskStatusPending {
			t.Errorf("want Status=pending, got %s", out.Task.Status)
		}
	})

	t.Run("タイトル空", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		interactor := usecase.NewCreateTaskInteractor(mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.CreateTaskInput{Title: "", CurrentUserID: 10})
		if err == nil {
			t.Error("expected validation error")
		}
	})

	t.Run("家族グループ未参加", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: nil}, nil)

		interactor := usecase.NewCreateTaskInteractor(mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.CreateTaskInput{Title: "皿洗い", CurrentUserID: 10})
		if err == nil {
			t.Error("expected error for user without family")
		}
	})
}
