# domain/model

## 役割
GORM タグ付きのエンティティ（ドメインモデル）を定義する層です。
ビジネスロジックは持たず、純粋なデータ構造のみを表現します。

## 実装規約
- GORM タグ付きの struct（エンティティ）はここに定義する
- 列挙型は型エイリアスで定義する（例: `type Status string`）
- 値は `const` で列挙する（例: `const StatusActive Status = "active"`）
- 他パッケージ（usecase, openapi）の型には依存しない

## 例
```go
package model

type User struct {
    ID        uint      `gorm:"primaryKey"`
    Name      string    `gorm:"not null"`
    CreatedAt time.Time
    UpdatedAt time.Time
}
```
