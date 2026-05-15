package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type GetNotificationsHandler struct {
	InputPort usecase.ListNotificationsInputPort
}

func (h *GetNotificationsHandler) GetNotifications(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.ListNotificationsInput{
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	resp := make([]iface_openapi.AppreciationResponse, len(out.Appreciations))
	for idx, a := range out.Appreciations {
		resp[idx] = iface_openapi.NewAppreciationResponse(a)
	}
	return ctx.JSON(http.StatusOK, resp)
}
