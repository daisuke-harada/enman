package usecase

import (
	"context"
	"strings"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/repository"
)

type LogoutUserInputPort interface {
	Execute(ctx context.Context, input LogoutUserInput) error
}

type LogoutUserInput struct {
	RefreshToken string
}

func (i *LogoutUserInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.RefreshToken) == "" {
		errs = append(errs, "リフレッシュトークンを入力してください")
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type LogoutUserInteractor struct {
	RefreshTokenRepo repository.RefreshTokenRepository
}

func NewLogoutUserInteractor(refreshTokenRepo repository.RefreshTokenRepository) *LogoutUserInteractor {
	return &LogoutUserInteractor{RefreshTokenRepo: refreshTokenRepo}
}

func (i *LogoutUserInteractor) Execute(ctx context.Context, input LogoutUserInput) error {
	if err := input.Validate(); err != nil {
		return err
	}
	tokenHash := hashToken(input.RefreshToken)
	_ = i.RefreshTokenRepo.DeleteByTokenHash(ctx, tokenHash)
	return nil
}
