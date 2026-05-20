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

func TestDeleteTaskInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("正常削除", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(5)).Return(&model.Task{ID: 5, FamilyID: familyID}, nil)
		mockTaskRepo.EXPECT().Delete(ctx, uint(5)).Return(nil)

		interactor := usecase.NewDeleteTaskInteractor(mockTaskRepo, mockUserRepo)
		err := interactor.Execute(ctx, usecase.DeleteTaskInput{TaskID: 5, CurrentUserID: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("家族未参加ユーザーはForbidden", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: nil}, nil)

		interactor := usecase.NewDeleteTaskInteractor(mockTaskRepo, mockUserRepo)
		err := interactor.Execute(ctx, usecase.DeleteTaskInput{TaskID: 5, CurrentUserID: 10})
		if err == nil {
			t.Error("expected Forbidden error")
		}
	})

	t.Run("存在しないタスクはNotFound", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(99)).Return(nil, errors.New("not found"))

		interactor := usecase.NewDeleteTaskInteractor(mockTaskRepo, mockUserRepo)
		err := interactor.Execute(ctx, usecase.DeleteTaskInput{TaskID: 99, CurrentUserID: 10})
		if err == nil {
			t.Error("expected NotFound error")
		}
	})

	t.Run("別家族のタスクはForbidden", func(t *testing.T) {
		otherFamilyID := uint(99)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(5)).Return(&model.Task{ID: 5, FamilyID: otherFamilyID}, nil)

		interactor := usecase.NewDeleteTaskInteractor(mockTaskRepo, mockUserRepo)
		err := interactor.Execute(ctx, usecase.DeleteTaskInput{TaskID: 5, CurrentUserID: 10})
		if err == nil {
			t.Error("expected Forbidden error for cross-family access")
		}
	})
}
