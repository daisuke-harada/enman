package usecase_test

import (
	"context"
	"testing"

	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestListTasksInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("フィルタなし（全タスク）", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().Search(ctx, gomock.Any()).Return([]*model.Task{
			{ID: 1, Title: "皿洗い", Status: model.TaskStatusPending},
			{ID: 2, Title: "掃除", Status: model.TaskStatusDone},
		}, nil)

		interactor := usecase.NewListTasksInteractor(mockTaskRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.ListTasksInput{CurrentUserID: 10})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Tasks) != 2 {
			t.Errorf("want 2 tasks, got %d", len(out.Tasks))
		}
	})

	t.Run("pendingフィルタ", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().Search(ctx, gomock.AssignableToTypeOf(repository.TaskSearchParams{})).Return([]*model.Task{
			{ID: 1, Title: "皿洗い", Status: model.TaskStatusPending},
		}, nil)

		filter := usecase.TaskFilterPending
		interactor := usecase.NewListTasksInteractor(mockTaskRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.ListTasksInput{CurrentUserID: 10, Filter: &filter})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Tasks) != 1 {
			t.Errorf("want 1 task, got %d", len(out.Tasks))
		}
	})
}
