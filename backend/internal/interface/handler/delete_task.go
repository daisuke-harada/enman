package handler

import (
	"net/http"

	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type DeleteTaskHandler struct {
	InputPort usecase.DeleteTaskInputPort
}

func (h *DeleteTaskHandler) DeleteTask(ctx echo.Context, taskId int64) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	if err := h.InputPort.Execute(ctx.Request().Context(), usecase.DeleteTaskInput{
		TaskID:        uint(taskId),
		CurrentUserID: userID,
	}); err != nil {
		return err
	}

	return ctx.NoContent(http.StatusNoContent)
}
