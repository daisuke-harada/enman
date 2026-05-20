package handler

import (
	"net/http"

	"github.com/daisuke-harada/enman/internal/domain/model"
	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PatchRecurrenceRulesHandler struct {
	InputPort usecase.UpdateRecurrenceRuleInputPort
}

func (h *PatchRecurrenceRulesHandler) PatchRecurrenceRules(ctx echo.Context, ruleID int64) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	var req iface_openapi.PatchRecurrenceRulesJSONRequestBody
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	input := usecase.UpdateRecurrenceRuleInput{
		RuleID:        uint(ruleID),
		Title:         req.Title,
		Category:      req.Category,
		Frequency:     model.RecurrenceFrequency(req.Frequency),
		StartDate:     req.StartDate.Time,
		CurrentUserID: userID,
	}
	if req.DayOfWeek != nil {
		dow := int8(*req.DayOfWeek)
		input.DayOfWeek = &dow
	}
	if req.DayOfMonth != nil {
		dom := int8(*req.DayOfMonth)
		input.DayOfMonth = &dom
	}
	if req.EndDate != nil {
		input.EndDate = &req.EndDate.Time
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), input)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, iface_openapi.NewRecurrenceRuleResponse(out.Rule))
}
