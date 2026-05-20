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

func TestUpdateProfileInteractor_Execute(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	ctx := context.Background()

	t.Run("名前のみ更新", func(t *testing.T) {
		newName := "新しい名前"
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, Name: "旧名前", Role: "父"}, nil)
		mockUserRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewUpdateProfileInteractor(mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.UpdateProfileInput{
			UserID: 10,
			Name:   &newName,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.User.Name != "新しい名前" {
			t.Errorf("want Name=新しい名前, got %s", out.User.Name)
		}
		if out.User.Role != "父" {
			t.Errorf("Role should not change, got %s", out.User.Role)
		}
	})

	t.Run("Role更新", func(t *testing.T) {
		newRole := "母"
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(10)).Return(&model.User{ID: 10, Name: "名前", Role: "父"}, nil)
		mockUserRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)

		interactor := usecase.NewUpdateProfileInteractor(mockUserRepo)
		out, err := interactor.Execute(ctx, usecase.UpdateProfileInput{UserID: 10, Role: &newRole})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.User.Role != "母" {
			t.Errorf("want Role=母, got %s", out.User.Role)
		}
	})

	t.Run("存在しないユーザーはNotFound", func(t *testing.T) {
		mockUserRepo := repositorymock.NewMockUserRepository(ctrl)
		mockUserRepo.EXPECT().FindByID(ctx, uint(99)).Return(nil, errors.New("not found"))

		interactor := usecase.NewUpdateProfileInteractor(mockUserRepo)
		_, err := interactor.Execute(ctx, usecase.UpdateProfileInput{UserID: 99})
		if err == nil {
			t.Error("expected NotFound error")
		}
	})
}
