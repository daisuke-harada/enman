package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PostFamiliesGoalsHandler struct {
	InputPort usecase.CreateFamilyGoalInputPort
}

func (h *PostFamiliesGoalsHandler) PostFamiliesGoals(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	var req iface_openapi.CreateFamilyGoalRequest
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.CreateFamilyGoalInput{
		CurrentUserID: userID,
		Title:         req.Title,
		TargetPoints:  req.TargetPoints,
	})
	if err != nil {
		return err
	}

	gwp := &usecase.FamilyGoalWithPoints{Goal: out.Goal, CurrentPoints: out.CurrentPoints}
	return ctx.JSON(http.StatusCreated, iface_openapi.NewFamilyGoalResponse(gwp))
}