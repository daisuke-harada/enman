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

func TestUpdateTaskInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("正常更新", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(5)).Return(&model.Task{ID: 5, FamilyID: familyID, Title: "古いタイトル"}, nil)
		mockTaskRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewUpdateTaskInteractor(mockTaskRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.UpdateTaskInput{
			TaskID:        5,
			Title:         "新しいタイトル",
			CurrentUserID: 10,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Task.Title != "新しいタイトル" {
			t.Errorf("want Title=新しいタイトル, got %s", out.Task.Title)
		}
	})

	t.Run("タイトル空はバリデーションエラー", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)

		interactor := usecase.NewUpdateTaskInteractor(mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.UpdateTaskInput{TaskID: 5, Title: "", CurrentUserID: 10})
		if err == nil {
			t.Error("expected validation error")
		}
	})

	t.Run("家族未参加ユーザーはForbidden", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: nil}, nil)

		interactor := usecase.NewUpdateTaskInteractor(mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.UpdateTaskInput{TaskID: 5, Title: "タイトル", CurrentUserID: 10})
		if err == nil {
			t.Error("expected Forbidden error")
		}
	})

	t.Run("存在しないタスクはNotFound", func(t *testing.T) {
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(99)).Return(nil, errors.New("not found"))

		interactor := usecase.NewUpdateTaskInteractor(mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.UpdateTaskInput{TaskID: 99, Title: "タイトル", CurrentUserID: 10})
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

		interactor := usecase.NewUpdateTaskInteractor(mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.UpdateTaskInput{TaskID: 5, Title: "タイトル", CurrentUserID: 10})
		if err == nil {
			t.Error("expected Forbidden error")
		}
	})
}
