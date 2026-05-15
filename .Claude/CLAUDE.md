# CLAUDE.md — Go + Next.js Full-Stack Template

## プロジェクト概要

Go（Echo v4 + GORM + MySQL）と Next.js 15（App Router + TanStack Query + Axios）の
フルスタック Web / iOS テンプレート。OpenAPI スキーマを唯一の真実として、
バックエンドのサーバーコードとフロントエンドの TypeScript 型を同時に自動生成する。

```
fullstack-template/
├── api/                        # OpenAPI スキーマ（唯一の真実）
│   ├── OpenAPI.yaml            # ← ここを編集して API を設計
│   └── resolved/openapi/openapi.yaml  # make gen で自動生成（編集禁止）
├── backend/                    # Go バックエンド
│   ├── cmd/api/main.go         # エントリーポイント
│   ├── internal/               # DDD レイヤー
│   │   ├── domain/             # モデル・リポジトリ・サービス定義
│   │   ├── usecase/            # ビジネスロジック
│   │   ├── infrastructure/     # DB 実装
│   │   └── interface/          # Echo ハンドラー・ミドルウェア
│   │       └── openapi/        # make gen で自動生成（編集禁止）
│   ├── pkg/                    # 共通ユーティリティ
│   ├── go.mod
│   └── makefile                # Backend 専用タスク
├── frontend/                   # Next.js フロントエンド（→ frontend/CLAUDE.md）
│   └── src/api-client/         # make gen で自動生成（編集禁止）
├── .github/workflows/
│   ├── ci.yaml                 # Backend ビルド・テスト + Frontend ビルド
│   └── cd.yaml                 # デプロイ（構成決定後に追記）
├── compose.yaml                # 開発用 Docker（DB + Swagger UI）
├── .envrc                      # 環境変数（direnv, gitignore 済み）
└── makefile                    # ルートオーケストレーター
```

---

## 開発プロセス（OpenAPI ファースト・厳守）

```
1. api/OpenAPI.yaml を編集
2. ルートで make gen
   → api/resolved/openapi/openapi.yaml を生成
   → Go サーバーコードを生成（internal/interface/openapi/）
   → TypeScript 型を生成（frontend/src/api-client/）
3. Go 側: TDD で usecase → handler を実装
4. フロント側: frontend/src/hooks/ にフックを実装
```

**直接編集禁止ファイル（make gen で上書きされる）:**
- `backend/internal/interface/openapi/api_server.gen.go`
- `backend/internal/interface/openapi/api_types.gen.go`
- `api/resolved/openapi/openapi.yaml`
- `frontend/src/api-client/` 配下すべて

---

## コマンド早見表

| コマンド | 説明 |
|---|---|
| `make setup` | 初回セットアップ |
| `make gen` | **全コード生成**（OpenAPI → Go + TS 同時） |
| `make backend-run` | Go バックエンド起動（port 1099） |
| `make frontend-dev` | Next.js 開発サーバー起動（port 3000） |
| `make backend-test` | Go テスト実行 |
| `make backend-lint` | Go リント実行 |
| `make frontend-build` | フロントエンド本番ビルド |

---

## Front → Back 通信

- バックエンドポート: **1099**（`SERVER_PORT` 環境変数で変更可）、フロントエンドポート: **3000**
- CORS は `backend/internal/interface/middleware/cors.go` で `localhost:3000` を許可済み
- フロントの `src/lib/api-client.ts` が axios の `baseURL` を `NEXT_PUBLIC_API_BASE_URL` から設定

---

## Backend — Go 実装規約

各ディレクトリの詳細は各 `CLAUDE.md` を参照。

### TDD（必須）
- Red → Green → Refactor サイクル
- `usecase` テスト → `handler` テストの順で先に書く
- `go test ./...` が全て通る状態を常に維持する

### エラーハンドリング
```go
return apperror.NotFound()
return apperror.NotFoundWithCause(err, "メッセージ")
return apperror.InternalServerError(err)
```

### ビルド保証
```sh
make gen && cd backend && go build ./... && make backend-lint && make backend-test
```

---

## Frontend — Next.js 実装規約

詳細は `frontend/CLAUDE.md` を参照。

- `src/api-client/` の生成コードをコンポーネントで直接呼ばない
- 必ず `src/hooks/` に `useQuery` / `useMutation` としてラップする

---

## 環境変数

- Go 側: `.envrc`（direnv 管理、gitignore 済み）— `.envrc.example` からコピー
- Next.js 側: `frontend/.env.local`（`frontend/.env.local.example` からコピー）

```sh
cp .envrc.example .envrc
cp frontend/.env.local.example frontend/.env.local
```

主な Go 側環境変数:

| 変数名 | 説明 | デフォルト |
|---|---|---|
| `SERVER_PORT` | バックエンドポート | `1099` |
| `DB_HOST` | DB ホスト | — |
| `DB_PORT` | DB ポート | `3306` |
| `DB_USER` | DB ユーザー | — |
| `DB_PASSWORD` | DB パスワード | — |
| `DB_NAME` | DB 名 | — |
| `JWT_SECRET_KEY` | JWT 署名キー | — |
