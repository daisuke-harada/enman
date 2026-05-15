package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type GetStatsContributionsHandler struct {
	InputPort usecase.GetContributionsInputPort
}

func (h *GetStatsContributionsHandler) GetStatsContributions(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.GetContributionsInput{
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	resp := make([]iface_openapi.ContributionItem, len(out.Items))
	for i, item := range out.Items {
		resp[i] = iface_openapi.NewContributionItemResponse(item)
	}
	return ctx.JSON(http.StatusOK, resp)
}