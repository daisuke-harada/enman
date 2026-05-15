package usecase_test

import (
	"context"
	"testing"

	"github.com/daisuke-harada/enman/internal/domain/model"
	repositorymock "github.com/daisuke-harada/enman/internal/domain/repository/mock"
	"github.com/daisuke-harada/enman/internal/usecase"
	"go.uber.org/mock/gomock"
)

func TestCreateFamilyInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	t.Run("正常作成", func(t *testing.T) {
		mockFamilyRepo := repositorymock.NewMockFamilyRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockFamilyRepo.EXPECT().Create(ctx, gomock.Any()).DoAndReturn(func(_ context.Context, f *model.Family) error {
			f.ID = 1
			return nil
		})
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10}, nil)
		mockUserRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewCreateFamilyInteractor(mockFamilyRepo, mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.CreateFamilyInput{Name: "田中家", CurrentUserID: 10})

		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Family.Name != "田中家" {
			t.Errorf("want Name=田中家, got %s", out.Family.Name)
		}
		if len(out.Family.InviteCode) != 12 {
			t.Errorf("want invite_code length=12, got %d", len(out.Family.InviteCode))
		}
	})

	t.Run("名前が空", func(t *testing.T) {
		mockFamilyRepo := repositorymock.NewMockFamilyRepository(ctrl)
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		interactor := usecase.NewCreateFamilyInteractor(mockFamilyRepo, mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.CreateFamilyInput{Name: "", CurrentUserID: 10})
		if err == nil {
			t.Error("expected validation error")
		}
	})
}
