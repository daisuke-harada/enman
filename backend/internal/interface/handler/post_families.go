package handler

import (
	"net/http"

	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	"github.com/daisuke-harada/enman/internal/usecase"
	"github.com/labstack/echo/v4"
)

type PostFamiliesHandler struct {
	InputPort usecase.CreateFamilyInputPort
}

func (h *PostFamiliesHandler) PostFamilies(ctx echo.Context) error {
	userID, err := currentUserID(ctx)
	if err != nil {
		return err
	}

	var req iface_openapi.PostFamiliesJSONRequestBody
	if err := ctx.Bind(&req); err != nil {
		return err
	}

	out, err := h.InputPort.Execute(ctx.Request().Context(), usecase.CreateFamilyInput{
		Name:          req.Name,
		CurrentUserID: userID,
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusCreated, iface_openapi.NewFamilyResponse(out.Family))
}
