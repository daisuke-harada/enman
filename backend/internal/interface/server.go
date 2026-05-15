package iface

import (
	"context"
	"errors"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"log/slog"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/daisuke-harada/enman/internal/config"
	"github.com/daisuke-harada/enman/internal/di"
	"github.com/daisuke-harada/enman/internal/interface/handler"
	"github.com/daisuke-harada/enman/internal/interface/middleware"
	"github.com/daisuke-harada/enman/internal/interface/openapi"
)

// NewEchoApp はDIコンテナを構築し、全ルートが登録済みの *echo.Echo を返します。
func NewEchoApp() (*echo.Echo, error) {
	container := di.NewContainer()
	container.MustProvide(NewEcho)
	container.MustProvide(config.Get)
	container.MustProvide(di.ProvideDB)
	di.BuildContainer(container)

	var e *echo.Echo
	if err := container.Invoke(func(echoInst *echo.Echo) {
		openapi.RegisterHandlers(echoInst, handler.NewHandler(container))
		e = echoInst
	}); err != nil {
		return nil, err
	}
	return e, nil
}

func Run(ctx context.Context) error {
	notifyCtx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	e, err := NewEchoApp()
	if err != nil {
		return err
	}

	cfg := config.Get()
	addr := ":" + cfg.Server.Port
	srv := &http.Server{Addr: addr}

	errCh := make(chan error, 1)
	go func() {
		slog.InfoContext(notifyCtx, "server starting", "addr", addr)
		err := e.StartServer(srv)
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
			return
		}
		errCh <- nil
	}()

	select {
	case err := <-errCh:
		if err != nil {
			slog.ErrorContext(notifyCtx, "server stopped with error", "err", err)
			return err
		}
	case <-notifyCtx.Done():
		slog.InfoContext(notifyCtx, "context canceled", "err", notifyCtx.Err())
	}

	shutdownCtx, cancel := context.WithTimeout(notifyCtx, 10*time.Second)
	defer cancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		slog.ErrorContext(ctx, "graceful shutdown failed", "err", err)
		return err
	}
	slog.InfoContext(ctx, "server shutdown complete")
	return nil
}

func NewEcho(cfg *config.Config) *echo.Echo {
	e := echo.New()
	e.HTTPErrorHandler = middleware.CustomHTTPErrorHandler
	e.Use(echoMiddleware.Recover())
	e.Use(echoMiddleware.RequestID())
	e.Use(middleware.CORSMiddleware())
	e.Use(middleware.RequestIDMiddleware)
	e.Use(middleware.AccessLogMiddleware)
	e.Use(middleware.JWTAuthMiddleware(cfg.JWT.SecretKey))
	return e
}
