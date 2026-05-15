package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type GetTaskTemplatesHandler struct {
	InputPort usecase.ListTaskTemplatesInputPort
}

func (h *GetTaskTemplatesHandler) GetTaskTemplates(ctx echo.Context) error {
	out, err := h.InputPort.Execute(ctx.Request().Context())
	if err != nil {
		return err
	}

	resp := make([]iface_openapi.TaskTemplateResponse, 0, len(out.Templates))
	for _, t := range out.Templates {
		resp = append(resp, iface_openapi.NewTaskTemplateResponse(t))
	}
	return ctx.JSON(http.StatusOK, resp)
}
