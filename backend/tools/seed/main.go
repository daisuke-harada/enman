// seed はデータベースにシードデータを投入するツールです。
package main

import (
	"context"
	"log/slog"

	"github.com/daisuke-harada/enman/internal/config"
	"github.com/daisuke-harada/enman/internal/domain/model"
	"github.com/daisuke-harada/enman/internal/infrastructure/db"
	"github.com/daisuke-harada/enman/pkg/logger"
)

var taskTemplates = []model.TaskTemplate{
	{Name: "皿洗い", Category: "キッチン"},
	{Name: "料理", Category: "キッチン"},
	{Name: "食材の買い出し", Category: "キッチン"},
	{Name: "ゴミ出し", Category: "ゴミ"},
	{Name: "ゴミ袋のセット", Category: "ゴミ"},
	{Name: "掃除機がけ", Category: "掃除"},
	{Name: "トイレ掃除", Category: "掃除"},
	{Name: "お風呂掃除", Category: "掃除"},
	{Name: "床の拭き掃除", Category: "掃除"},
	{Name: "洗濯", Category: "洗濯"},
	{Name: "洗濯物の干し", Category: "洗濯"},
	{Name: "洗濯物の取り込み", Category: "洗濯"},
	{Name: "アイロンがけ", Category: "洗濯"},
	{Name: "子どものお風呂", Category: "育児"},
	{Name: "子どもの寝かしつけ", Category: "育児"},
	{Name: "保育園・学校の準備", Category: "育児"},
	{Name: "電球・電池の交換", Category: "その他"},
	{Name: "郵便物の確認", Category: "その他"},
}

func main() {
	logger.Init("seed", false)
	defer logger.Close()

	cfg := config.Get()
	gormDB, err := db.Connect(context.Background(), cfg.DB)
	if err != nil {
		slog.Error("failed to connect db", "err", err)
		return
	}

	for _, tmpl := range taskTemplates {
		t := tmpl
		if err := gormDB.Where(model.TaskTemplate{Name: t.Name}).FirstOrCreate(&t).Error; err != nil {
			slog.Error("failed to seed task_template", "name", t.Name, "err", err)
			return
		}
	}

	slog.Info("seed completed", "task_templates", len(taskTemplates))
}
