package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type DeleteAuthLogoutHandler struct {
	InputPort usecase.LogoutUserInputPort
}

func (h *DeleteAuthLogoutHandler) DeleteAuthLogout(ctx echo.Context) error {
	var req iface_openapi.DeleteAuthLogoutJSONRequestBody
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	if err := h.InputPort.Execute(ctx.Request().Context(), usecase.LogoutUserInput{
		RefreshToken: req.RefreshToken,
	}); err != nil {
		return err
	}

	return ctx.NoContent(http.StatusNoContent)
}
