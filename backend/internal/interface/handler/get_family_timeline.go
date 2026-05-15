package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type GetFamilyTimelineHandler struct {
	InputPort usecase.GetFamilyTimelineInputPort
}

func (h *GetFamilyTimelineHandler) GetFamilyTimeline(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.GetFamilyTimelineInput{
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	resp := make([]iface_openapi.AppreciationResponse, len(out.Appreciations))
	for i, a := range out.Appreciations {
		resp[i] = iface_openapi.NewAppreciationResponse(a)
	}
	return ctx.JSON(http.StatusOK, resp)
}