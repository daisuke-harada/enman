package main

import (
	"context"
	"log/slog"
	"os"

	iface "github.com/daisuke-harada/enman/internal/interface"
	"github.com/daisuke-harada/enman/pkg/logger"
)

func main() {
	logger.Init("app", false)
	defer logger.Close()

	if err := iface.Run(context.Background()); err != nil {
		// Use slog's package-level helper (configured by logger.Init)
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}
