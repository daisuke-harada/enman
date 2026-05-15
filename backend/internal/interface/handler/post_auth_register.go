package handler

import (
	"net/http"

	"github.com/daisuke-harada/enman/internal/config"
	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PostAuthRegisterHandler struct {
	InputPort usecase.RegisterUserInputPort
}

func (h *PostAuthRegisterHandler) PostAuthRegister(ctx echo.Context) error {
	var req iface_openapi.PostAuthRegisterJSONRequestBody
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	cfg := config.Get()
	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.RegisterUserInput{
		Name:      req.Name,
		Email:     string(req.Email),
		Password:  req.Password,
		Role:      req.Role,
		JWTSecret: cfg.JWT.SecretKey,
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusCreated, iface_openapi.NewAuthResponseFromRegister(out))
}
