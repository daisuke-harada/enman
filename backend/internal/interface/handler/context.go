package handler

import (
	"github.com/daisuke-harada/enman/internal/apperror"
	"github.com/daisuke-harada/enman/internal/interface/middleware"
	"github.com/labstack/echo/v4"
)

func currentUserID(ctx echo.Context) (uint, error) {
	val := ctx.Get(middleware.CurrentUserIDKey)
	if val == nil {
		return 0, apperror.Unauthorized()
	}
	id, ok := val.(uint)
	if !ok {
		return 0, apperror.Unauthorized()
	}
	return id, nil
}
