package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestUpdateRecurrenceRuleInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()
	now := time.Now()

	t.Run("正常更新（毎日）", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockRuleRepo.EXPECT().FindByID(ctx, uint(3)).Return(&model.RecurrenceRule{ID: 3, CreatedBy: 10, Title: "旧タイトル"}, nil)
		mockRuleRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewUpdateRecurrenceRuleInteractor(mockRuleRepo)
		out, err := interactor.Execute(ctx, usecase.UpdateRecurrenceRuleInput{
			RuleID:        3,
			Title:         "新タイトル",
			Frequency:     model.RecurrenceFrequencyDaily,
			StartDate:     now,
			CurrentUserID: 10,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Rule.Title != "新タイトル" {
			t.Errorf("want Title=新タイトル, got %s", out.Rule.Title)
		}
	})

	t.Run("タイトル空はバリデーションエラー", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)

		interactor := usecase.NewUpdateRecurrenceRuleInteractor(mockRuleRepo)
		_, err := interactor.Execute(ctx, usecase.UpdateRecurrenceRuleInput{
			RuleID:        3,
			Title:         "",
			Frequency:     model.RecurrenceFrequencyDaily,
			StartDate:     now,
			CurrentUserID: 10,
		})
		if err == nil {
			t.Error("expected validation error")
		}
	})

	t.Run("存在しないルールはNotFound", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockRuleRepo.EXPECT().FindByID(ctx, uint(99)).Return(nil, errors.New("not found"))

		interactor := usecase.NewUpdateRecurrenceRuleInteractor(mockRuleRepo)
		_, err := interactor.Execute(ctx, usecase.UpdateRecurrenceRuleInput{
			RuleID:        99,
			Title:         "タイトル",
			Frequency:     model.RecurrenceFrequencyDaily,
			StartDate:     now,
			CurrentUserID: 10,
		})
		if err == nil {
			t.Error("expected NotFound error")
		}
	})

	t.Run("作成者以外はForbidden", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockRuleRepo.EXPECT().FindByID(ctx, uint(3)).Return(&model.RecurrenceRule{ID: 3, CreatedBy: 99}, nil)

		interactor := usecase.NewUpdateRecurrenceRuleInteractor(mockRuleRepo)
		_, err := interactor.Execute(ctx, usecase.UpdateRecurrenceRuleInput{
			RuleID:        3,
			Title:         "タイトル",
			Frequency:     model.RecurrenceFrequencyDaily,
			StartDate:     now,
			CurrentUserID: 10,
		})
		if err == nil {
			t.Error("expected Forbidden error")
		}
	})
}
