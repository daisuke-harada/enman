//go:build tools

// tools はビルドツールの依存関係を go.mod に固定するためのファイルです。
// このファイル自体はビルドに含まれません。
package tools

import (
	_ "github.com/oapi-codegen/runtime"
	_ "github.com/samber/lo"
	_ "go.uber.org/mock/mockgen"
)
