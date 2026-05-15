package openapi

import (
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/usecase"
)

func NewUserResponse(user *model.User) UserResponse {
	id := int64(user.ID)
	resp := UserResponse{
		Id:         &id,
		Name:       &user.Name,
		Role:       &user.Role,
		Email:      &user.Email,
		EnmanPoint: &user.EnmanPoint,
		CreatedAt:  &user.CreatedAt,
		IconUrl:    user.IconURL,
	}
	if user.FamilyID != nil {
		fid := int64(*user.FamilyID)
		resp.FamilyId = &fid
	}
	return resp
}

func NewFamilyResponse(family *model.Family) FamilyResponse {
	id := int64(family.ID)
	return FamilyResponse{
		Id:         &id,
		Name:       &family.Name,
		InviteCode: &family.InviteCode,
		CreatedAt:  &family.CreatedAt,
	}
}

func NewAuthResponseFromRegister(out *usecase.RegisterUserOutput) AuthResponse {
	userResp := NewUserResponse(out.User)
	return AuthResponse{
		User:         &userResp,
		AccessToken:  &out.AccessToken,
		RefreshToken: &out.RefreshToken,
	}
}

func NewAuthResponseFromLogin(out *usecase.LoginUserOutput) AuthResponse {
	userResp := NewUserResponse(out.User)
	return AuthResponse{
		User:         &userResp,
		AccessToken:  &out.AccessToken,
		RefreshToken: &out.RefreshToken,
	}
}

func NewTokenResponse(out *usecase.RefreshAccessTokenOutput) TokenResponse {
	return TokenResponse{
		AccessToken:  &out.AccessToken,
		RefreshToken: &out.RefreshToken,
	}
}
