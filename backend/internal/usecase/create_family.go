package usecase

import (
	"context"
	"strings"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type CreateFamilyInputPort interface {
	Execute(ctx context.Context, input CreateFamilyInput) (*CreateFamilyOutput, error)
}

type CreateFamilyInput struct {
	Name          string
	CurrentUserID uint
}

func (i *CreateFamilyInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.Name) == "" {
		errs = append(errs, "家族グループ名を入力してください")
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type CreateFamilyOutput struct {
	Family *model.Family
}

type CreateFamilyInteractor struct {
	FamilyRepo repository.FamilyRepository
	UserRepo   repository.UserRepository
}

func NewCreateFamilyInteractor(familyRepo repository.FamilyRepository, userRepo repository.UserRepository) *CreateFamilyInteractor {
	return &CreateFamilyInteractor{FamilyRepo: familyRepo, UserRepo: userRepo}
}

func (i *CreateFamilyInteractor) Execute(ctx context.Context, input CreateFamilyInput) (*CreateFamilyOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	inviteCode, err := generateInviteCode()
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	family := &model.Family{
		Name:       input.Name,
		InviteCode: inviteCode,
	}
	if err := i.FamilyRepo.Create(ctx, family); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}
	user.FamilyID = &family.ID
	if err := i.UserRepo.Update(ctx, user); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &CreateFamilyOutput{Family: family}, nil
}
