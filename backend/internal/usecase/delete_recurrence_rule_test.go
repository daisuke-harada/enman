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

func TestDeleteRecurrenceRuleInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	t.Run("正常削除", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockRuleRepo.EXPECT().FindByID(ctx, uint(3)).Return(&model.RecurrenceRule{ID: 3, CreatedBy: 10}, nil)
		mockRuleRepo.EXPECT().Delete(ctx, uint(3)).Return(nil)

		interactor := usecase.NewDeleteRecurrenceRuleInteractor(mockRuleRepo)
		err := interactor.Execute(ctx, usecase.DeleteRecurrenceRuleInput{RuleID: 3, CurrentUserID: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("存在しないルールはNotFound", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockRuleRepo.EXPECT().FindByID(ctx, uint(99)).Return(nil, errors.New("not found"))

		interactor := usecase.NewDeleteRecurrenceRuleInteractor(mockRuleRepo)
		err := interactor.Execute(ctx, usecase.DeleteRecurrenceRuleInput{RuleID: 99, CurrentUserID: 10})
		if err == nil {
			t.Error("expected NotFound error")
		}
	})

	t.Run("作成者以外はForbidden", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockRuleRepo.EXPECT().FindByID(ctx, uint(3)).Return(&model.RecurrenceRule{ID: 3, CreatedBy: 99}, nil)

		interactor := usecase.NewDeleteRecurrenceRuleInteractor(mockRuleRepo)
		err := interactor.Execute(ctx, usecase.DeleteRecurrenceRuleInput{RuleID: 3, CurrentUserID: 10})
		if err == nil {
			t.Error("expected Forbidden error")
		}
	})
}
