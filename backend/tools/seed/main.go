// seed はデータベースにシードデータを投入するツールです。
// 各プロジェクトで必要なシードデータをここに実装してください。
package main

import (
	"context"
	"log/slog"

	"github.com/your-org/app/internal/config"
	"github.com/your-org/app/internal/infrastructure/db"
	"github.com/your-org/app/pkg/logger"
)

func main() {
	logger.Init("seed", false)
	defer logger.Close()

	cfg := config.Get()
	_, err := db.Connect(context.Background(), cfg.DB)
	if err != nil {
		slog.Error("failed to connect db", "err", err)
		return
	}

	// TODO: シードデータ投入処理をここに実装してください
	slog.Info("seed completed")
}
