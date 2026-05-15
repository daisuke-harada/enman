package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/domain/repository"
	jwtpkg "github.com/daisuke-harada/enman/internal/pkg/jwt"
	"golang.org/x/crypto/bcrypt"
)

type LoginUserInputPort interface {
	Execute(ctx context.Context, input LoginUserInput) (*LoginUserOutput, error)
}

type LoginUserInput struct {
	Email     string
	Password  string
	JWTSecret string
}

func (i *LoginUserInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.Email) == "" {
		errs = append(errs, "メールアドレスを入力してください")
	}
	if strings.TrimSpace(i.Password) == "" {
		errs = append(errs, "パスワードを入力してください")
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type LoginUserOutput struct {
	User         *model.User
	AccessToken  string
	RefreshToken string
}

type LoginUserInteractor struct {
	UserRepo         repository.UserRepository
	RefreshTokenRepo repository.RefreshTokenRepository
}

func NewLoginUserInteractor(userRepo repository.UserRepository, refreshTokenRepo repository.RefreshTokenRepository) *LoginUserInteractor {
	return &LoginUserInteractor{UserRepo: userRepo, RefreshTokenRepo: refreshTokenRepo}
}

func (i *LoginUserInteractor) Execute(ctx context.Context, input LoginUserInput) (*LoginUserOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	user, err := i.UserRepo.FindByEmail(ctx, input.Email)
	if err != nil {
		return nil, apperror.Unauthorized("メールアドレスまたはパスワードが正しくありません")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordDigest), []byte(input.Password)); err != nil {
		return nil, apperror.Unauthorized("メールアドレスまたはパスワードが正しくありません")
	}

	accessToken, err := jwtpkg.Encode(user.ID, input.JWTSecret)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	rawRefreshToken, tokenHash, err := generateRefreshToken()
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	rt := &model.RefreshToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiredAt: time.Now().Add(30 * 24 * time.Hour),
	}
	if err := i.RefreshTokenRepo.Create(ctx, rt); err != nil {
		return nil, apperror.InternalServerError(err)
	}

	return &LoginUserOutput{User: user, AccessToken: accessToken, RefreshToken: rawRefreshToken}, nil
}
