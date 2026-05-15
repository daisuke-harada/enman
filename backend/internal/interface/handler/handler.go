package handler

import (
	"github.com/your-org/app/internal/di"
)

// NewHandler は DI コンテナから各ハンドラーを初期化して Handler を返します。
// 新しいエンドポイントを追加するたびに、ここに InputPort の初期化を追加してください。
func NewHandler(container *di.Container) *Handler {
	return &Handler{
		GetHealthHandler: GetHealthHandler{},
	}
}
