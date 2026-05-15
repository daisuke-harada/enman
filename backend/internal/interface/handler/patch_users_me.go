package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PatchUsersMeHandler struct {
	InputPort usecase.UpdateProfileInputPort
}

func (h *PatchUsersMeHandler) PatchUsersMe(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	var req iface_openapi.PatchUsersMeJSONRequestBody
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.UpdateProfileInput{
		UserID:  userID,
		Name:    req.Name,
		Role:    req.Role,
		IconURL: req.IconUrl,
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, iface_openapi.NewUserResponse(out.User))
}
