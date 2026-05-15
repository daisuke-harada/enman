package middleware

import (
	"strings"

	"github.com/your-org/app/internal/apperror"
	iface_openapi "github.com/your-org/app/internal/interface/openapi"
	jwtpkg "github.com/your-org/app/internal/pkg/jwt"
	"github.com/labstack/echo/v4"
)

// JWTAuthMiddleware は JWT Bearer トークンを検証します。
// 認証が必要かどうかは iface_openapi.RequiresBearerAuth を通じて判定します。
// ユーザー情報の取得・セットはアプリケーション固有のため、各プロジェクトで実装してください。
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
			_, err := jwtpkg.Decode(tokenStr, secretKey)
			if err != nil {
				return err
			}

			// TODO: トークンから取得した userID でユーザーをフェッチし、
			// ctx.Set("currentUser", user) でコンテキストにセットしてください。

			return next(ctx)
		}
	}
}
