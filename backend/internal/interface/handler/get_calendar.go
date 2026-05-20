package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type GetCalendarHandler struct {
	InputPort usecase.GetCalendarInputPort
}

func (h *GetCalendarHandler) GetCalendar(ctx echo.Context, params iface_openapi.GetCalendarParams) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.GetCalendarInput{
		Year:          params.Year,
		Month:         params.Month,
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	resp := make([]iface_openapi.CalendarDayItem, 0, len(out.Days))
	for _, day := range out.Days {
		resp = append(resp, iface_openapi.NewCalendarDayItemResponse(day))
	}
	return ctx.JSON(http.StatusOK, resp)
}
