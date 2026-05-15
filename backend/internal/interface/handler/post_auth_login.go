package handler

import (
	"net/http"

	"github.com/daisuke-harada/enman/internal/config"
	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PostAuthLoginHandler struct {
	InputPort usecase.LoginUserInputPort
}

func (h *PostAuthLoginHandler) PostAuthLogin(ctx echo.Context) error {
	var req iface_openapi.PostAuthLoginJSONRequestBody
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	cfg := config.Get()
	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.LoginUserInput{
		Email:     string(req.Email),
		Password:  req.Password,
		JWTSecret: cfg.JWT.SecretKey,
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, iface_openapi.NewAuthResponseFromLogin(out))
}
