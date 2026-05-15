package usecase

import (
	"context"
	"strings"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type JoinFamilyInputPort interface {
	Execute(ctx context.Context, input JoinFamilyInput) (*JoinFamilyOutput, error)
}

type JoinFamilyInput struct {
	InviteCode    string
	CurrentUserID uint
}

func (i *JoinFamilyInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.InviteCode) == "" {
		errs = append(errs, "招待コードを入力してください")
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type JoinFamilyOutput struct {
	Family *model.Family
}

type JoinFamilyInteractor struct {
	FamilyRepo repository.FamilyRepository
	UserRepo   repository.UserRepository
}

func NewJoinFamilyInteractor(familyRepo repository.FamilyRepository, userRepo repository.UserRepository) *JoinFamilyInteractor {
	return &JoinFamilyInteractor{FamilyRepo: familyRepo, UserRepo: userRepo}
}

func (i *JoinFamilyInteractor) Execute(ctx context.Context, input JoinFamilyInput) (*JoinFamilyOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	family, err := i.FamilyRepo.FindByInviteCode(ctx, input.InviteCode)
	if err != nil {
		return nil, apperror.NotFound("招待コードが見つかりません")
	}

	user, err := i.UserRepo.FindByID(ctx, input.CurrentUserID)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}
	user.FamilyID = &family.ID
	if err := i.UserRepo.Update(ctx, user); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &JoinFamilyOutput{Family: family}, nil
}
