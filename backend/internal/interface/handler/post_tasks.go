package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PostTasksHandler struct {
	InputPort usecase.CreateTaskInputPort
}

func (h *PostTasksHandler) PostTasks(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	var req iface_openapi.PostTasksJSONRequestBody
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.CreateTaskInput{
		Title:         req.Title,
		Category:      req.Category,
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusCreated, iface_openapi.NewTaskResponse(out.Task))
}
