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

type RegisterUserInputPort interface {
	Execute(ctx context.Context, input RegisterUserInput) (*RegisterUserOutput, error)
}

type RegisterUserInput struct {
	Name      string
	Email     string
	Password  string
	Role      string
	JWTSecret string
}

func (i *RegisterUserInput) Validate() error {
	var errs []string
	if strings.TrimSpace(i.Name) == "" {
		errs = append(errs, "名前を入力してください")
	}
	if strings.TrimSpace(i.Email) == "" {
		errs = append(errs, "メールアドレスを入力してください")
	}
	if len(i.Password) < 8 {
		errs = append(errs, "パスワードは8文字以上で入力してください")
	}
	if strings.TrimSpace(i.Role) == "" {
		errs = append(errs, "役割を入力してください")
	} else if len([]rune(i.Role)) > 20 {
		errs = append(errs, "役割は20文字以内で入力してください")
	}
	if len(errs) > 0 {
		return apperror.UnprocessableEntity(errs...)
	}
	return nil
}

type RegisterUserOutput struct {
	User         *model.User
	AccessToken  string
	RefreshToken string
}

type RegisterUserInteractor struct {
	UserRepo         repository.UserRepository
	RefreshTokenRepo repository.RefreshTokenRepository
}

func NewRegisterUserInteractor(userRepo repository.UserRepository, refreshTokenRepo repository.RefreshTokenRepository) *RegisterUserInteractor {
	return &RegisterUserInteractor{UserRepo: userRepo, RefreshTokenRepo: refreshTokenRepo}
}

func (i *RegisterUserInteractor) Execute(ctx context.Context, input RegisterUserInput) (*RegisterUserOutput, error) {
	if err := input.Validate(); err != nil {
		return nil, err
	}

	existing, _ := i.UserRepo.FindByEmail(ctx, input.Email)
	if existing != nil {
		return nil, apperror.UnprocessableEntity("このメールアドレスは既に使用されています")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperror.InternalServerError(err)
	}

	user := &model.User{
		Name:           input.Name,
		Email:          input.Email,
		PasswordDigest: string(hash),
		Role:           input.Role,
	}
	if err := i.UserRepo.Create(ctx, user); err != nil {
		return nil, apperror.InternalServerError(err)
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

	return &RegisterUserOutput{User: user, AccessToken: accessToken, RefreshToken: rawRefreshToken}, nil
}
