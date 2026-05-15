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

func TestJoinFamilyInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	t.Run("正常参加", func(t *testing.T) {
		mockFamilyRepo := repositorymock.NewMockFamilyRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		familyID := uint(5)
		mockFamilyRepo.EXPECT().FindByInviteCode(ctx, "ABC123DEF456").Return(&model.Family{ID: familyID, Name: "山田家"}, nil)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10}, nil)
		mockUserRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewJoinFamilyInteractor(mockFamilyRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.JoinFamilyInput{InviteCode: "ABC123DEF456", CurrentUserID: 10})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Family.Name != "山田家" {
			t.Errorf("want Name=山田家, got %s", out.Family.Name)
		}
	})

	t.Run("招待コード不正", func(t *testing.T) {
		mockFamilyRepo := repositorymock.NewMockFamilyRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockFamilyRepo.EXPECT().FindByInviteCode(ctx, "INVALID").Return(nil, errors.New("not found"))

		interactor := usecase.NewJoinFamilyInteractor(mockFamilyRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.JoinFamilyInput{InviteCode: "INVALID", CurrentUserID: 10})
		if err == nil {
			t.Error("expected not found error")
		}
	})
}
