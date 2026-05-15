package middleware

import (
	"strings"

	"github.com/daisuke-harada/enman/internal/apperror"
	iface_openapi "github.com/daisuke-harada/enman/internal/interface/openapi"
	jwtpkg "github.com/daisuke-harada/enman/internal/pkg/jwt"
	"github.com/labstack/echo/v4"
)

const CurrentUserIDKey = "currentUserID"

func JWTAuthMiddleware(secretKey string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			req := ctx.Request()

			if !iface_openapi.RequiresBearerAuth(req.Method, ctx.Path()) {
				return next(ctx)
			}

			authHeader := req.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				return apperror.Unauthorized("認証が必要です。")
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			userID, err := jwtpkg.Decode(tokenStr, secretKey)
			if err != nil {
				return err
			}

			ctx.Set(CurrentUserIDKey, userID)
			return next(ctx)
		}
	}
}
