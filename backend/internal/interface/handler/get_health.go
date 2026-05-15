package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type GetHealthHandler struct{}

func (h *GetHealthHandler) GetHealth(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
