package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	jwtpkg "github.com/daisuke-harada/enman/internal/pkg/jwt"
)

type RefreshAccessTokenInputPort interface {
	Execute(ctx context.Context, input RefreshAccessTokenInput) (*RefreshAccessTokenOutput, error)
}

type RefreshAccessTokenInput struct {
	RefreshToken string
	JWTSecret    string
}

func (i *RefreshAccessTokenInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.RefreshToken) == "" {
		errs = append(errs, "リフレッシュトークンを入力してください")
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type RefreshAccessTokenOutput struct {
	AccessToken  string
	RefreshToken string
}

type RefreshAccessTokenInteractor struct {
	RefreshTokenRepo repository.RefreshTokenRepository
}

func NewRefreshAccessTokenInteractor(refreshTokenRepo repository.RefreshTokenRepository) *RefreshAccessTokenInteractor {
	return &RefreshAccessTokenInteractor{RefreshTokenRepo: refreshTokenRepo}
}

func (i *RefreshAccessTokenInteractor) Execute(ctx context.Context, input RefreshAccessTokenInput) (*RefreshAccessTokenOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	tokenHash := hashToken(input.RefreshToken)
	rt, err := i.RefreshTokenRepo.FindByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, apperror.Unauthorized("リフレッシュトークンが無効です")
	}

	if rt.ExpiredAt.Before(time.Now()) {
		_ = i.RefreshTokenRepo.DeleteByTokenHash(ctx, tokenHash)
		return nil, apperror.Unauthorized("リフレッシュトークンの有効期限が切れています")
	}

	accessToken, err := jwtpkg.Encode(rt.UserID, input.JWTSecret)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	_ = i.RefreshTokenRepo.DeleteByTokenHash(ctx, tokenHash)

	rawNewToken, newTokenHash, err := generateRefreshToken()
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	newRT := &model.RefreshToken{
		UserID:    rt.UserID,
		TokenHash: newTokenHash,
		ExpiredAt: time.Now().Add(30 * 24 * time.Hour),
	}
	if err := i.RefreshTokenRepo.Create(ctx, newRT); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &RefreshAccessTokenOutput{AccessToken: accessToken, RefreshToken: rawNewToken}, nil
}
