package usecase_test

import (
	"context"
	"testing"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestListRecurrenceRulesInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	familyID := uint(1)

	t.Run("正常取得", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockRuleRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.RecurrenceRule{
			{ID: 1, Title: "皿洗い", FamilyID: familyID},
			{ID: 2, Title: "掃除", FamilyID: familyID},
		}, nil)

		interactor := usecase.NewListRecurrenceRulesInteractor(mockRuleRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.ListRecurrenceRulesInput{CurrentUserID: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Rules) != 2 {
			t.Errorf("want 2 rules, got %d", len(out.Rules))
		}
	})

	t.Run("家族未参加ユーザーはエラー", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: nil}, nil)

		interactor := usecase.NewListRecurrenceRulesInteractor(mockRuleRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.ListRecurrenceRulesInput{CurrentUserID: 10})
		if err == nil {
			t.Error("expected error for user without family")
		}
	})

	t.Run("ルールなしは空スライス", func(t *testing.T) {
		mockRuleRepo := repositorymock.NewMockRecurrenceRuleRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, FamilyID: &familyID}, nil)
		mockRuleRepo.EXPECT().FindByFamilyID(ctx, familyID).Return([]*model.RecurrenceRule{}, nil)

		interactor := usecase.NewListRecurrenceRulesInteractor(mockRuleRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.ListRecurrenceRulesInput{CurrentUserID: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(out.Rules) != 0 {
			t.Errorf("want 0 rules, got %d", len(out.Rules))
		}
	})
}
