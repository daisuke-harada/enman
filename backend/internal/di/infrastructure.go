package di

import (
	"context"

	"github.com/your-org/app/internal/config"
	"github.com/your-org/app/internal/infrastructure/db"
	"gorm.io/gorm"
)

// ProvideDB provides *gorm.DB constructed by infrastructure/db.Connect.
func ProvideDB(cfg *config.Config) (*gorm.DB, error) {
	return db.Connect(context.Background(), cfg.DB)
}

// ProvideRepositories は全リポジトリのコンストラクタを Container に登録します。
// 新しいリポジトリを追加する場合はここに ct.MustProvide(...) を追記してください。
func ProvideRepositories(ct *Container) {
}

// ProvideServices は全ドメインサービスのコンストラクタを Container に登録します。
func ProvideServices(ct *Container) {
}

// ProvideUsecases は全ユースケースのコンストラクタを Container に登録します。
func ProvideUsecases(ct *Container) {
}
