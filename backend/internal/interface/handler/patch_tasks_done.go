package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PatchTasksDoneHandler struct {
	InputPort usecase.CompleteTaskInputPort
}

func (h *PatchTasksDoneHandler) PatchTasksDone(ctx echo.Context, taskId int64) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.CompleteTaskInput{
		TaskID:        uint(taskId),
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, iface_openapi.NewTaskResponse(out.Task))
}
