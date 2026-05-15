package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PostTasksAppreciationHandler struct {
	InputPort usecase.SendAppreciationInputPort
}

func (h *PostTasksAppreciationHandler) PostTasksAppreciation(ctx echo.Context, taskId int64) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	var req iface_openapi.SendAppreciationRequest
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	input := usecase.SendAppreciationInput{
		TaskID:     uint(taskId),
		FromUserID: userID,
		StampType:  string(req.StampType),
		Message:    req.Message,
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), input)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusCreated, iface_openapi.NewAppreciationResponse(out.Appreciation))
}
