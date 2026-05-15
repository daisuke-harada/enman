package handler

import (
	"net/http"

	"github.com/daisuke-harada/enman/internal/config"
	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PostAuthRefreshHandler struct {
	InputPort usecase.RefreshAccessTokenInputPort
}

func (h *PostAuthRefreshHandler) PostAuthRefresh(ctx echo.Context) error {
	var req iface_openapi.PostAuthRefreshJSONRequestBody
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	cfg := config.Get()
	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.RefreshAccessTokenInput{
		RefreshToken: req.RefreshToken,
		JWTSecret:    cfg.JWT.SecretKey,
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, iface_openapi.NewTokenResponse(out))
}
