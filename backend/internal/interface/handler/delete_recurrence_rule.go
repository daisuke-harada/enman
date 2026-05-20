package handler

import (
	"net/http"

	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type DeleteRecurrenceRuleHandler struct {
	InputPort usecase.DeleteRecurrenceRuleInputPort
}

func (h *DeleteRecurrenceRuleHandler) DeleteRecurrenceRule(ctx echo.Context, ruleID int64) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	if err := h.InputPort.Execute(ctx.Request().Context(), usecase.DeleteRecurrenceRuleInput{
		RuleID:        uint(ruleID),
		CurrentUserID: userID,
	}); err != nil {
		return err
	}

	return ctx.NoContent(http.StatusNoContent)
}
