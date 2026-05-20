package handler

import (
	"net/http"
	"time"

	openapi_types "github.com/oapi-codegen/runtime/types"
	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

// toTimePtr は openapi_types.Date をポインタに変換するヘルパー
func dateToTimePtr(d *openapi_types.Date) *time.Time {
	if d == nil {
		return nil
	}
	t := d.Time
	return &t
}

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

	input := usecase.CreateTaskInput{
		Title:         req.Title,
		Category:      req.Category,
		CurrentUserID: userID,
	}
	if req.RecurrenceRuleId != nil {
		id := uint(*req.RecurrenceRuleId)
		input.RecurrenceRuleID = &id
	}
	input.ScheduledDate = dateToTimePtr(req.ScheduledDate)

	out, err := h.InputPort.Execute(ctx.Request().Context(), input)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusCreated, iface_openapi.NewTaskResponse(out.Task))
}
