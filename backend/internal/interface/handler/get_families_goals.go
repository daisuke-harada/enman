package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type GetFamiliesGoalsHandler struct {
	InputPort usecase.ListFamilyGoalsInputPort
}

func (h *GetFamiliesGoalsHandler) GetFamiliesGoals(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.ListFamilyGoalsInput{
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	resp := make([]iface_openapi.FamilyGoalResponse, len(out.Goals))
	for i, gwp := range out.Goals {
		resp[i] = iface_openapi.NewFamilyGoalResponse(gwp)
	}
	return ctx.JSON(http.StatusOK, resp)
}