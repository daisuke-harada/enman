package usecase_test

import (
	"context"
	"testing"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestCompleteTaskInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("正常完了", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		user := &model.User{ID: 10, FamilyID: &familyID, EnmanPoint: 0}
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(user, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(5)).Return(&model.Task{
			ID: 5, FamilyID: familyID, Status: model.TaskStatusPending,
		}, nil)
		mockTaskRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
		mockUserRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewCompleteTaskInteractor(mockTaskRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.CompleteTaskInput{TaskID: 5, CurrentUserID: 10})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Task.Status != model.TaskStatusDone {
			t.Errorf("want Status=done, got %s", out.Task.Status)
		}
		if out.Task.DoneAt == nil {
			t.Error("DoneAt should not be nil")
		}
		if user.EnmanPoint != usecase.PointCompleteTask {
			t.Errorf("want EnmanPoint=%d, got %d", usecase.PointCompleteTask, user.EnmanPoint)
		}
	})

	t.Run("既に完了済み", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(5)).Return(&model.Task{
			ID: 5, FamilyID: familyID, Status: model.TaskStatusDone,
		}, nil)

		interactor := usecase.NewCompleteTaskInteractor(mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.CompleteTaskInput{TaskID: 5, CurrentUserID: 10})
		if err == nil {
			t.Error("expected error for already done task")
		}
	})

	t.Run("別家族のタスク", func(t *testing.T) {
		otherFamilyID := uint(99)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(5)).Return(&model.Task{
			ID: 5, FamilyID: otherFamilyID, Status: model.TaskStatusPending,
		}, nil)

		interactor := usecase.NewCompleteTaskInteractor(mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.CompleteTaskInput{TaskID: 5, CurrentUserID: 10})
		if err == nil {
			t.Error("expected forbidden error for task in different family")
		}
	})
}
