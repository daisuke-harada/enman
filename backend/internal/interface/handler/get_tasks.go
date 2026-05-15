package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type GetTasksHandler struct {
	InputPort usecase.ListTasksInputPort
}

func (h *GetTasksHandler) GetTasks(ctx echo.Context, params iface_openapi.GetTasksParams) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	input := usecase.ListTasksInput{CurrentUserID: userID}
	if params.Status != nil {
		f := usecase.TaskFilter(*params.Status)
		input.Filter = &f
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), input)
	if err != nil {
		return err
	}

	resp := make([]iface_openapi.TaskResponse, 0, len(out.Tasks))
	for _, t := range out.Tasks {
		resp = append(resp, iface_openapi.NewTaskResponse(t))
	}
	return ctx.JSON(http.StatusOK, resp)
}
