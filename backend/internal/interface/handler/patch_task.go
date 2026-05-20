package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PatchTaskHandler struct {
	InputPort usecase.UpdateTaskInputPort
}

func (h *PatchTaskHandler) PatchTask(ctx echo.Context, taskId int64) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	var req iface_openapi.PatchTaskJSONRequestBody
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.UpdateTaskInput{
		TaskID:        uint(taskId),
		Title:         req.Title,
		Category:      req.Category,
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, iface_openapi.NewTaskResponse(out.Task))
}
