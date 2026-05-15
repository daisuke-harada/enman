# fullstack-template

Go + Next.js のフルスタックモノレポテンプレート。  
**Web ブラウザ** と **iOS アプリ（Capacitor）** の両方で動作することを前提に設計されています。

```
fullstack-template/
├── backend/    Go (Echo v4 / GORM / MySQL)  ← port 1099
├── frontend/   Next.js 15 + Capacitor       ← port 3000（開発時）
└── makefile    全タスクのエントリーポイント
```

---

## 必要なツール

| ツール | 用途 | インストール方法 |
|---|---|---|
| Go 1.26.2 | バックエンド | [goenv](https://github.com/go-nenv/goenv) または公式 |
| Node.js 22+ | フロントエンド | [nvm](https://github.com/nvm-sh/nvm) |
| Docker / Docker Compose | MySQL + Swagger UI | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| direnv | 環境変数管理 | `brew install direnv` |
| mysqldef | DBスキーマ管理 | `brew install sqldef/sqldef/mysqldef` |
| mockgen | モック生成 | `go install go.uber.org/mock/mockgen@latest` |
| golangci-lint | Go リント | `brew install golangci-lint` |
| Xcode | iOS ビルド | Mac App Store |

---

## セットアップ

### 1. 環境変数の準備

```sh
# .envrc を作成（direnv で自動読み込みされる）
cp .envrc.example .envrc    # なければ手動で作成（下記参照）
direnv allow

# フロントエンドの環境変数
cp frontend/.env.local.example frontend/.env.local
```

`.envrc` に設定が必要な変数：

```sh
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=rootpassword
export DB_ROOT_PASSWORD=rootpassword
export DB_NAME=app_db
export JWT_SECRET_KEY=your-secret-key-32chars-or-more
export GOOGLE_MAPS_API_KEY=your-google-maps-api-key   # 不要なら省略可
```

### 2. 一括セットアップ

```sh
make setup
```

内部で以下を順に実行します：

1. `make backend-deps` — Go モジュールのダウンロード
2. `make frontend-install` — npm パッケージのインストール
3. `make gen` — OpenAPI → Go コード + TypeScript 型の生成
4. `make docker-up` — MySQL + Swagger UI の起動
5. `make backend-apply-schema` — DBスキーマの適用
6. `make backend-db-seed` — 初期データの投入

---

## 開発サーバーの起動

バックエンドとフロントエンドを**別々のターミナル**で起動します。

### バックエンド（Go）

```sh
make backend-run
# => go run ./cmd/api/main.go
# => http://localhost:1099 で起動
```

### フロントエンド（Next.js）

```sh
make frontend-dev
# => next dev
# => http://localhost:3000 で起動
```

---

## 動作検証

### バックエンドの確認

```sh
# ヘルスチェック
curl http://localhost:1099/health
# => {"status":"ok"}
```

### フロントエンドの確認

ブラウザで `http://localhost:3000` を開きます。

- ページ中央に **「Backend Health」** セクションが表示される
- バックエンドが起動していれば 🟢 `status: ok` が表示される
- バックエンドが停止していれば 🔴 「バックエンドに接続できません」と表示される

### Swagger UI（API ドキュメント）

```sh
make docker-up   # 起動していない場合
open http://localhost:8080
```

`api/OpenAPI.yaml` の内容が可視化されます。

---

## コマンド一覧

### 全体

| コマンド | 説明 |
|---|---|
| `make setup` | 初回セットアップ一括実行 |
| `make gen` | **OpenAPI → Go コード + TypeScript 型を同時生成** |
| `make docker-up` | Docker コンテナ起動（MySQL + Swagger UI） |

### バックエンド

| コマンド | 説明 |
|---|---|
| `make backend-run` | Go サーバー起動（port 1099） |
| `make backend-test` | テスト実行（`go test ./...`） |
| `make backend-lint` | リント実行（golangci-lint） |
| `make backend-gen` | Go コードのみ生成 |
| `make backend-apply-schema` | DBスキーマ適用（mysqldef） |
| `make backend-db-seed` | シードデータ投入 |
| `make backend-db-drop` | DB を空にしてスキーマを再適用 |

### フロントエンド

| コマンド | 説明 |
|---|---|
| `make frontend-dev` | 開発サーバー起動（port 3000） |
| `make frontend-build` | 静的書き出し（`frontend/out/` に出力） |
| `make frontend-gen` | TypeScript 型のみ生成 |
| `make frontend-install` | npm パッケージインストール |

### iOS

| コマンド | 説明 |
|---|---|
| `make ios-sync` | ビルド → Capacitor iOS プロジェクトへ同期 |

---

## API の追加・変更手順

このテンプレートは OpenAPI ファーストです。チームでの差分管理を確実にするため、OpenAPI の path 定義は必ず `api/paths/` に YAML ファイルとして追加してください。

要点:

- 各エンドポイントの path 定義は `api/paths/<resource>.yaml` に分割して配置します。
- `api/OpenAPI.yaml` には `components` や `servers` を置き、`paths` は `$ref` で `api/paths/*.yaml` を参照する形にしてください。

推奨ワークフロー（ステップ順）:

1) OpenAPI の変更（paths を追加/更新）

	- 新しいエンドポイントは必ず `api/paths/` にファイルを追加します。
	- 例: `api/paths/date_spots.yaml` に path 定義を追加し、schema は `api/components/schemas/` に置く。

2) コード生成

	- 生成コマンド: `make gen`
	- このコマンドで Go の server インターフェース（`internal/interface/openapi`）とフロントエンド用 TypeScript 型が同時に生成されます。

3) バックエンド実装（TDD）

	- 必ず Red → Green → Refactor のサイクルで進めてください。
	- 推奨順序:
	  1. `internal/usecase/` に対するユニットテストを先に書く（`package usecase_test`）
	  2. テストをパスさせるために `Interactor` を実装する
	  3. 必要なモックは `internal/usecase/mock/` や `internal/domain/repository/mock/` に用意する（`mockgen` を使用）
	  4. handler のテストを書く（`internal/interface/handler`）
	  5. handler を実装してテストを通す
	  6. 最後に DI（`internal/di/infrastructure.go` など）へ登録する

4) フロントエンド実装

	- `make gen` により生成された TypeScript 型とクライアントを使って、`frontend/src/hooks/` に `useQuery` / `useMutation` を実装します。

5) 動作確認

	- バックエンド起動: `make backend-run`（別ターミナル）
	- フロントエンド起動: `make frontend-dev`（別ターミナル）
	- Swagger UI（`make docker-up` → `http://localhost:8080`）で生成された OpenAPI を確認できます。

補足:

- `make gen` は `api/paths/` にあるパス定義を読み込んで生成します。`OpenAPI.yaml` に直接 paths を書き込む運用は避けてください。
- path ファイル名とスキーマの配置ルールはチームで統一してください（例: `users.yaml`, `date_spots.yaml`）。
- enum 等を追加した場合は `make gen` の後に `go build ./...` を実行し、必要ならモックやテストを再生成/修正してください。


---

## iOS アプリとして動かす

### 初回のみ

```sh
# Xcode と CocoaPods が必要
cd frontend && npx cap add ios
```

### 通常のビルドフロー

```sh
# 1. 本番 API の URL を設定してビルド
#    （実機では localhost は使えないため）
echo "NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com" > frontend/.env.local

# 2. ビルド → iOS プロジェクトへ同期
make ios-sync

# 3. Xcode で開いてシミュレーターまたは実機で確認
cd frontend && npx cap open ios
```

> **注意:** iOS シミュレーターは `http://localhost:1099` に接続できます。
> 実機でテストする場合は必ず本番 URL または同一 LAN 上の IP アドレスを使用してください。

---

## テスト・品質チェック

```sh
# バックエンドのテスト
make backend-test

# バックエンドのリント
make backend-lint

# フロントエンドのビルド確認（型エラー検出）
make frontend-build

# フルチェック（PR 前に推奨）
make backend-lint && make backend-test && make frontend-build
```

---

## ディレクトリ詳細

```
backend/
├── api/
│   ├── OpenAPI.yaml              # ← API設計はここを編集する
│   ├── paths/                    # パスごとの定義（$ref で分割）
│   ├── components/               # 共通スキーマ定義
│   └── resolved/openapi/         # make gen で自動生成（編集禁止）
├── cmd/api/main.go               # エントリーポイント
├── internal/
│   ├── domain/                   # モデル・リポジトリ・サービス定義
│   ├── usecase/                  # ビジネスロジック（TDD で実装）
│   ├── infrastructure/           # DB実装（GORM）
│   └── interface/
│       ├── handler/              # Echo ハンドラー
│       ├── middleware/           # CORS・認証・ログ
│       └── openapi/              # make gen で自動生成（編集禁止）
└── makefile

frontend/
├── capacitor.config.ts           # Capacitor 設定（appId を変更すること）
├── openapi-ts.config.ts          # → api/resolved/openapi/openapi.yaml
├── src/
│   ├── api-client/               # make gen で自動生成（編集禁止）
│   ├── app/                      # Next.js App Router
│   ├── hooks/                    # API フック（useQuery / useMutation）
│   └── lib/
│       └── api-client.ts         # axios baseURL の設定
├── out/                          # next build の出力（gitignore済み）
└── ios/                          # Capacitor iOS プロジェクト（gitignore済み）
```

---

## 新しいアプリへの適用方法

このテンプレートをコピーして新しいアプリを作る場合の変更箇所：

| ファイル | 変更内容 |
|---|---|
| `backend/go.mod` | `module` 名を変更（例: `github.com/yourname/your-app`） |
| `api/OpenAPI.yaml` | `title` と `servers.url` を変更 |
| `frontend/capacitor.config.ts` | `appId` と `appName` を変更 |
| `frontend/package.json` | `name` を変更 |
| `.envrc` | 本番 DB・シークレットを設定 |
| `frontend/.env.local` | `NEXT_PUBLIC_API_BASE_URL` を本番 URL に変更 |
