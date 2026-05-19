package usecase_test

import (
	"context"
	"testing"
	"time"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestSendAppreciationInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)
	doneByUserID := uint(20)
	now := time.Now()

	doneTask := &model.Task{
		ID:       5,
		FamilyID: familyID,
		Status:   model.TaskStatusDone,
		DoneBy:   &doneByUserID,
		DoneAt:   &now,
	}

	t.Run("正常送信", func(t *testing.T) {
		mockAppreciationRepo := repositorymock.NewMockAppreciationRepository(ctrl)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)

		fromUser := &model.User{ID: 10, FamilyID: &familyID, EnmanPoint: 0}
		toUser := &model.User{ID: 20, FamilyID: &familyID, EnmanPoint: 0}

		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(fromUser, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(5)).Return(doneTask, nil)
		mockAppreciationRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
		mockUserRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
		mockUserRepo.EXPECT().FindByID(ctx, doneByUserID).Return(toUser, nil)
		mockUserRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewSendAppreciationInteractor(mockAppreciationRepo, mockTaskRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.SendAppreciationInput{
			TaskID:     5,
			FromUserID: 10,
			Message:    "ピカピカだね！",
		})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Appreciation.ToUserID != doneByUserID {
			t.Errorf("want ToUserID=%d, got %d", doneByUserID, out.Appreciation.ToUserID)
		}
		if out.Appreciation.Message == nil || *out.Appreciation.Message != "ピカピカだね！" {
			t.Errorf("want Message=ピカピカだね！, got %v", out.Appreciation.Message)
		}
	})

	t.Run("未完了タスクにはコメント不可", func(t *testing.T) {
		mockAppreciationRepo := repositorymock.NewMockAppreciationRepository(ctrl)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)

		pendingTask := &model.Task{ID: 5, FamilyID: familyID, Status: model.TaskStatusPending}
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(5)).Return(pendingTask, nil)

		interactor := usecase.NewSendAppreciationInteractor(mockAppreciationRepo, mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.SendAppreciationInput{
			TaskID:     5,
			FromUserID: 10,
			Message:    "ありがとう",
		})
		if err == nil {
			t.Error("expected error for pending task")
		}
	})

	t.Run("自分完了タスクにはコメント不可", func(t *testing.T) {
		mockAppreciationRepo := repositorymock.NewMockAppreciationRepository(ctrl)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)

		selfDoneTask := &model.Task{ID: 5, FamilyID: familyID, Status: model.TaskStatusDone, DoneBy: func() *uint { u := uint(10); return &u }(), DoneAt: &now}
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockTaskRepo.EXPECT().FindByID(ctx, uint(5)).Return(selfDoneTask, nil)

		interactor := usecase.NewSendAppreciationInteractor(mockAppreciationRepo, mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.SendAppreciationInput{
			TaskID:     5,
			FromUserID: 10,
			Message:    "ありがとう",
		})
		if err == nil {
			t.Error("expected error for self-completed task")
		}
	})

	t.Run("空コメントはバリデーションエラー", func(t *testing.T) {
		mockAppreciationRepo := repositorymock.NewMockAppreciationRepository(ctrl)
		mockTaskRepo := repositorymock.NewMockTaskRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)

		interactor := usecase.NewSendAppreciationInteractor(mockAppreciationRepo, mockTaskRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.SendAppreciationInput{
			TaskID:     5,
			FromUserID: 10,
			Message:    "",
		})
		if err == nil {
			t.Error("expected validation error for empty message")
		}
	})
}
