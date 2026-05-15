package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type GetUsersMeHandler struct {
	InputPort usecase.GetCurrentUserInputPort
}

func (h *GetUsersMeHandler) GetUsersMe(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.GetCurrentUserInput{
		UserID: userID,
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, iface_openapi.NewUserResponse(out.User))
}
