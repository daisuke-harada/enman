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

func TestCreateRecurrenceRuleInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)
	startDate := time.Date(2026, 5, 19, 0, 0, 0, 0, time.UTC)

	t.Run("毎日の繰り返しルールを作成", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)

		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockRuleRepo.EXPECT().Create(ctx, gomock.Any()).DoAndReturn(func(_ context.Context, r *model.RecurrenceRule) error {
			r.ID = 1
			return nil
		})

		interactor := usecase.NewCreateRecurrenceRuleInteractor(mockRuleRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.CreateRecurrenceRuleInput{
			Title:         "皿洗い",
			Frequency:     model.RecurrenceFrequencyDaily,
			StartDate:     startDate,
			CurrentUserID: 10,
		})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Rule.Title != "皿洗い" {
			t.Errorf("want Title=皿洗い, got %s", out.Rule.Title)
		}
		if out.Rule.Frequency != model.RecurrenceFrequencyDaily {
			t.Errorf("want Frequency=daily, got %s", out.Rule.Frequency)
		}
	})

	t.Run("タイトル空", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		interactor := usecase.NewCreateRecurrenceRuleInteractor(mockRuleRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.CreateRecurrenceRuleInput{
			Title:         "",
			Frequency:     model.RecurrenceFrequencyDaily,
			StartDate:     startDate,
			CurrentUserID: 10,
		})
		if err == nil {
			t.Error("expected validation error for empty title")
		}
	})

	t.Run("weekly で day_of_week 未設定", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		interactor := usecase.NewCreateRecurrenceRuleInteractor(mockRuleRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.CreateRecurrenceRuleInput{
			Title:         "皿洗い",
			Frequency:     model.RecurrenceFrequencyWeekly,
			StartDate:     startDate,
			CurrentUserID: 10,
		})
		if err == nil {
			t.Error("expected validation error for missing day_of_week")
		}
	})

	t.Run("家族グループ未参加", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: nil}, nil)
		interactor := usecase.NewCreateRecurrenceRuleInteractor(mockRuleRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.CreateRecurrenceRuleInput{
			Title:         "皿洗い",
			Frequency:     model.RecurrenceFrequencyDaily,
			StartDate:     startDate,
			CurrentUserID: 10,
		})
		if err == nil {
			t.Error("expected error for user without family")
		}
	})
}
