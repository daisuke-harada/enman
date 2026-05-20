package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type GetRecurrenceRulesHandler struct {
	InputPort usecase.ListRecurrenceRulesInputPort
}

func (h *GetRecurrenceRulesHandler) GetRecurrenceRules(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.ListRecurrenceRulesInput{
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	resp := make([]iface_openapi.RecurrenceRuleResponse, 0, len(out.Rules))
	for _, r := range out.Rules {
		resp = append(resp, iface_openapi.NewRecurrenceRuleResponse(r))
	}
	return ctx.JSON(http.StatusOK, resp)
}
