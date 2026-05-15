package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PostFamiliesJoinHandler struct {
	InputPort usecase.JoinFamilyInputPort
}

func (h *PostFamiliesJoinHandler) PostFamiliesJoin(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	var req iface_openapi.PostFamiliesJoinJSONRequestBody
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.JoinFamilyInput{
		InviteCode:    req.InviteCode,
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, iface_openapi.NewFamilyResponse(out.Family))
}
