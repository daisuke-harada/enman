# enman（円満）

> 家族の感謝を可視化する、家事管理・ありがとう共有アプリ

家事の「名もなき労働」を記録し、家族が互いにスタンプで感謝を伝え合うことで、家庭内のポジティブな循環を作り出すフルスタックアプリです。  
**Web ブラウザ** と **iOS アプリ（Capacitor）** の両方で動作します。

---

## 目次

- [機能一覧](#機能一覧)
- [技術スタック](#技術スタック)
- [アーキテクチャ](#アーキテクチャ)
- [ディレクトリ構成](#ディレクトリ構成)
- [クイックスタート](#クイックスタート)
- [開発ガイド](#開発ガイド)
- [makeコマンド一覧](#makeコマンド一覧)
- [APIエンドポイント一覧](#apiエンドポイント一覧)
- [DBスキーマ](#dbスキーマ)
- [E2Eテスト](#e2eテスト)
- [環境変数](#環境変数)
- [シードデータ](#シードデータ)
- [iOS対応](#ios対応)

---

## 機能一覧

### フェーズ1 — ユーザー・家族管理（Foundation）

| 機能 | 説明 |
|---|---|
| ユーザー登録 | 名前・役割（パパ/ママ/長男/長女/その他）・メール・パスワードで登録 |
| ログイン / ログアウト | JWT 認証（アクセストークン + リフレッシュトークン） |
| 家族グループ作成 | グループ名を入力してユニークな招待コードを発行 |
| 家族グループ参加 | 招待コード（12文字）を入力して既存グループに参加 |
| プロフィール編集 | 名前・役割を後から変更可能 |
| 円満ポイント表示 | プロフィール画面でポイント残高を表示 |

### フェーズ2 — 家事（タスク）管理（Core）

| 機能 | 説明 |
|---|---|
| クイック登録 | タイトルのみで即座にタスクを作成 |
| テンプレートから登録 | よくある家事 18種類（キッチン・ゴミ・掃除・洗濯・育児・その他）から選択 |
| タスク一覧表示 | 「これからやること」「今日終わったこと」タブで切り替え |
| 完了報告 | ワンタップで完了。コンフェッティアニメーション付き |
| タスク編集・削除 | 作成済みタスクのタイトル・カテゴリーを変更、または削除 |
| 繰り返しルール | 毎日・毎週など繰り返しタスクのルールを設定・管理 |
| カレンダー表示 | 日付ごとのタスクをカレンダービューで確認 |
| バリデーション | タスク名未入力時のエラーメッセージ表示 |

### フェーズ3 — 感謝（Appreciation）システム（USP）

| 機能 | 説明 |
|---|---|
| 感謝スタンプ送信 | 他の家族が完了したタスクに 5種類の絵文字スタンプ（👏🙏💕❤️⭐）でリアクション |
| 円満ポイント加算 | タスク完了で +1pt、スタンプを送る・受け取るそれぞれで +1pt 付与 |
| 通知センター | 受け取った感謝スタンプの履歴一覧を確認 |

### フェーズ4 — 可視化・ダッシュボード（Engagement）

| 機能 | 説明 |
|---|---|
| 貢献度グラフ | 家族メンバーごとの家事カテゴリー分布を円グラフで表示 |
| 感謝のタイムライン | 家族間の「ありがとう」が流れるログ |
| ご褒美目標 | 目標（例: 週末の焼肉）と目標ポイントを設定し、プログレスバーで進捗を可視化 |
| ご褒美目標追加 | フォームから新しい目標をその場で追加 |

### UI / UX

| 機能 | 説明 |
|---|---|
| レスポンシブデザイン | モバイル（BottomNav）/ デスクトップ（Sidebar）で最適なレイアウト |
| Warm & Organic デザイン | グラスモーフィズム・グラデーション・Framer Motion アニメーション |
| 未ログイン保護 | 認証されていない状態でのアクセスはログイン画面へリダイレクト |
| 家族未設定保護 | 家族グループ未参加のユーザーはセットアップ画面へリダイレクト |

---

## 技術スタック

### バックエンド

| 技術 | バージョン | 用途 |
|---|---|---|
| Go | 1.26.2 | メイン言語 |
| Echo v4 | 4.15.1 | Web フレームワーク |
| GORM | 1.30.0 | ORM |
| MySQL | 8.0 | データベース |
| golang-jwt | 5.3.1 | JWT 認証 |
| oapi-codegen | — | OpenAPI サーバーコード生成 |
| go.uber.org/dig | 1.18.1 | 依存注入 |
| go.uber.org/mock | 0.6.0 | モック生成（テスト用） |
| golangci-lint | — | 静的解析 |
| mysqldef | — | DB スキーマ管理 |

### フロントエンド

| 技術 | バージョン | 用途 |
|---|---|---|
| Next.js | 15.1.0 | フレームワーク（App Router） |
| React | 19.0.0 | UI ライブラリ |
| TypeScript | 5 | 型安全 |
| Tailwind CSS | 3.4.0 | スタイリング |
| TanStack Query | 5.62.0 | サーバーステート管理 |
| Axios | 1.7.0 | HTTP クライアント |
| Framer Motion | 12.38.0 | アニメーション |
| Recharts | 3.8.1 | グラフ |
| Capacitor | 8.3.4 | iOS アプリ化 |
| @hey-api/openapi-ts | 0.95.0 | TypeScript 型生成 |
| Playwright | 1.60.0 | E2E テスト |
| canvas-confetti | 1.9.4 | コンフェッティ演出 |

### インフラ

| 技術 | 用途 |
|---|---|
| Docker Compose | MySQL + Swagger UI のローカル開発環境 |
| direnv | 環境変数管理（`.envrc`） |

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                    クライアント                       │
│   Next.js 15 (App Router / 静的書き出し)              │
│   TanStack Query + Axios + Framer Motion             │
│             ↕ NEXT_PUBLIC_API_BASE_URL               │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│                 バックエンド (Go)                     │
│  Echo v4 → OpenAPI Handler → Usecase → Repository   │
│              DDD レイヤー構成                         │
│                          │                          │
│               GORM (MySQL 8)                        │
└─────────────────────────────────────────────────────┘
```

### OpenAPI ファースト開発フロー

```
api/OpenAPI.yaml を編集
        ↓
make gen（Go コード + TypeScript 型を同時生成）
        ↓
backend: usecase → handler を TDD で実装
frontend: hooks と pages を実装
        ↓
make e2e（Playwright E2E テスト）
        ↓
make ios-sync（Capacitor iOS へ同期）
```

---

## ディレクトリ構成

```
enman/
├── api/                          # OpenAPI スキーマ（唯一の真実）
│   ├── OpenAPI.yaml              # 全エンドポイント定義
│   ├── paths/                    # パス定義（$ref で分割管理）
│   ├── components/schemas/       # 共通スキーマ
│   └── resolved/                 # 自動生成（編集禁止）
│
├── backend/                      # Go バックエンド
│   ├── cmd/api/main.go           # エントリーポイント
│   ├── internal/
│   │   ├── domain/               # モデル・リポジトリ IF・サービス
│   │   ├── usecase/              # ビジネスロジック（TDD）
│   │   ├── infrastructure/       # DB 実装（GORM）
│   │   ├── interface/
│   │   │   ├── handler/          # HTTP ハンドラー（20+）
│   │   │   ├── middleware/       # CORS・認証・ロギング
│   │   │   └── openapi/          # 自動生成コード（編集禁止）
│   │   ├── config/               # 環境変数
│   │   ├── apperror/             # カスタムエラー
│   │   └── di/                   # 依存注入（dig）
│   ├── pkg/jwt/                  # JWT ユーティリティ
│   ├── tools/seed/               # シードデータ投入
│   └── makefile
│
├── frontend/                     # Next.js フロントエンド
│   ├── src/
│   │   ├── app/                  # ページ（App Router）
│   │   │   ├── page.tsx          # ホーム（タスク一覧）
│   │   │   ├── login/            # ログイン・新規登録
│   │   │   ├── dashboard/        # ダッシュボード
│   │   │   ├── notifications/    # 通知センター
│   │   │   ├── profile/          # プロフィール
│   │   │   ├── tasks/new/        # タスク作成
│   │   │   └── family/setup/     # 家族グループ設定
│   │   ├── components/
│   │   │   ├── AppShell.tsx      # レイアウト基盤
│   │   │   ├── AuthGuard.tsx     # 認証ガード
│   │   │   ├── BottomNav.tsx     # モバイルナビ
│   │   │   └── Sidebar.tsx       # サイドバー
│   │   ├── hooks/                # API ラッパーフック
│   │   ├── api-client/           # 自動生成クライアント（編集禁止）
│   │   └── lib/                  # axios・QueryClient・auth
│   ├── e2e/                      # Playwright テスト（55ケース）
│   ├── playwright.config.ts
│   ├── next.config.ts
│   └── capacitor.config.ts
│
├── compose.yaml                  # Docker（MySQL + Swagger UI）
├── .envrc.example                # 環境変数テンプレート
└── makefile                      # ルートオーケストレーター
```

---

## クイックスタート

### 前提条件

| ツール | 用途 | インストール |
|---|---|---|
| Go 1.26.2+ | バックエンド | [goenv](https://github.com/syndbg/goenv) 推奨 |
| Node.js 20+ | フロントエンド | [nvm](https://github.com/nvm-sh/nvm) 推奨 |
| Docker Desktop | MySQL + Swagger UI | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| direnv | 環境変数管理 | `brew install direnv` |
| mysqldef | DB スキーマ管理 | `brew install sqldef/sqldef/mysqldef` |
| mockgen | モック生成 | `go install go.uber.org/mock/mockgen@latest` |
| golangci-lint | Go リント | `brew install golangci-lint` |

### 初回セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/daisuke-harada/enman.git
cd enman

# 2. 環境変数を設定
cp .envrc.example .envrc
cp frontend/.env.local.example frontend/.env.local
direnv allow

# 3. 依存インストール・DB構築・シードデータ投入まで一括実行
make setup
```

### 起動

```bash
# バックエンド (port 1099) + フロントエンド (port 3000) を同時起動
make dev
```

ブラウザで http://localhost:3000 を開く。

### 動作確認

```bash
# API ヘルスチェック
curl http://localhost:1099/health
# => {"status":"ok"}

# Swagger UI（API ドキュメント）
open http://localhost:8080
```

---

## 開発ガイド

### API を追加・変更する

```bash
# 1. OpenAPI スキーマを編集
vim api/OpenAPI.yaml

# 2. Go コード + TypeScript 型を同時生成
make gen

# 3. バックエンドに usecase → handler を TDD で実装
# 4. フロントエンドに hooks → page/component を実装
```

**自動生成されるファイル（編集禁止）**:
- `backend/internal/interface/openapi/api_server.gen.go`
- `backend/internal/interface/openapi/api_types.gen.go`
- `api/resolved/openapi/openapi.yaml`
- `frontend/src/api-client/` 配下すべて

### DBスキーマを変更する

```bash
# 1. スキーマファイルを編集
vim backend/internal/infrastructure/db/schema.sql

# 2. 差分のみ安全に適用（mysqldef）
make backend-apply-schema
```

### テスト実行

```bash
# バックエンド単体テスト
make backend-test

# E2E テスト（バックエンドを別ターミナルで起動しておく）
make e2e

# E2E レポートをブラウザで確認
make e2e-report

# E2E をインタラクティブUIモードで実行（デバッグ用）
make e2e-ui
```

### DBをリセットしてシードを再投入

```bash
make db-reset
```

---

## makeコマンド一覧

### セットアップ・DB

| コマンド | 説明 |
|---|---|
| `make setup` | 初回セットアップ（依存・生成・DB・Seed 全て） |
| `make db-setup` | DB をゼロから構築して Seed 投入 |
| `make db-reset` | DB 完全リセット後に再構築・Seed 投入 |
| `make docker-up` | MySQL + Swagger UI コンテナ起動 |

### 開発

| コマンド | 説明 |
|---|---|
| `make dev` | バックエンド + フロントエンド同時起動 |
| `make gen` | OpenAPI → Go + TypeScript 型を同時生成 |
| `make backend-run` | バックエンドのみ起動（port 1099） |
| `make frontend-dev` | フロントエンドのみ起動（port 3000） |
| `make frontend-build` | フロントエンドを本番ビルド（`out/` に出力） |

### テスト・品質

| コマンド | 説明 |
|---|---|
| `make backend-test` | Go ユニットテスト実行 |
| `make backend-lint` | golangci-lint 実行 |
| `make e2e` | Playwright E2E テスト実行（全 60 ケース） |
| `make e2e-file FILE=e2e/01-auth.spec.ts` | 特定ファイルのみ E2E 実行 |
| `make e2e-report` | テスト結果レポートをブラウザで確認 |
| `make e2e-ui` | インタラクティブ UI モードで E2E 実行（デバッグ用） |

### iOS

| コマンド | 説明 |
|---|---|
| `make ios-sync` | 本番ビルド → Capacitor iOS プロジェクトに同期 |

---

## APIエンドポイント一覧

ベースURL: `http://localhost:1099`  
Swagger UI: `http://localhost:8080`

### 認証

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| POST | `/auth/register` | ユーザー登録 | 不要 |
| POST | `/auth/login` | ログイン | 不要 |
| POST | `/auth/refresh` | アクセストークン更新 | 不要 |
| DELETE | `/auth/logout` | ログアウト（リフレッシュトークン無効化） | 要 |

### ユーザー・プロフィール

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/users/me` | ログインユーザー情報取得 | 要 |
| PATCH | `/users/me` | プロフィール更新（名前・役割） | 要 |

### 家族グループ

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| POST | `/families` | 家族グループ作成 | 要 |
| POST | `/families/join` | 招待コードで家族グループに参加 | 要 |
| GET | `/families/goals` | ご褒美目標一覧取得 | 要 |
| POST | `/families/goals` | ご褒美目標作成 | 要 |

### タスク

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/tasks` | タスク一覧取得（`?status=pending` / `today_done`） | 要 |
| POST | `/tasks` | タスク作成 | 要 |
| PATCH | `/tasks/{taskId}` | タスク編集（タイトル・カテゴリー） | 要 |
| DELETE | `/tasks/{taskId}` | タスク削除 | 要 |
| PATCH | `/tasks/{taskId}/done` | タスクを完了にする | 要 |
| GET | `/task-templates` | タスクテンプレート一覧 | 要 |

### 繰り返しルール・カレンダー

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/recurrence-rules` | 繰り返しルール一覧取得 | 要 |
| POST | `/recurrence-rules` | 繰り返しルール作成 | 要 |
| PATCH | `/recurrence-rules/{ruleId}` | 繰り返しルール編集 | 要 |
| DELETE | `/recurrence-rules/{ruleId}` | 繰り返しルール削除 | 要 |
| GET | `/calendar` | カレンダー取得（`?year=&month=`） | 要 |

### 感謝スタンプ・通知

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| POST | `/tasks/{taskId}/appreciations` | 感謝スタンプ送信 | 要 |
| GET | `/notifications` | 受信した感謝通知一覧 | 要 |

### 統計・タイムライン

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/stats/contributions` | 家族の貢献度統計（カテゴリー別） | 要 |
| GET | `/family/timeline` | 家族の感謝タイムライン | 要 |

### システム

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/health` | ヘルスチェック |

---

## DBスキーマ

```
families
  id            BIGINT PK
  name          VARCHAR
  invite_code   VARCHAR UNIQUE

users
  id            BIGINT PK
  family_id     BIGINT FK(families)
  name          VARCHAR
  role          VARCHAR
  email         VARCHAR UNIQUE
  password_digest VARCHAR
  enman_point   INT DEFAULT 0

refresh_tokens
  id            BIGINT PK
  user_id       BIGINT FK(users)
  token_hash    VARCHAR UNIQUE
  expired_at    DATETIME

task_templates
  id            BIGINT PK
  name          VARCHAR
  category      VARCHAR

tasks
  id            BIGINT PK
  family_id     BIGINT FK(families)
  created_by    BIGINT FK(users)
  done_by       BIGINT FK(users) NULL
  title         VARCHAR
  category      VARCHAR
  status        ENUM('pending','done')
  done_at       DATETIME NULL

family_goals
  id            BIGINT PK
  family_id     BIGINT FK(families)
  title         VARCHAR
  target_points INT

appreciations
  id            BIGINT PK
  task_id       BIGINT FK(tasks)
  from_user_id  BIGINT FK(users)
  to_user_id    BIGINT FK(users)
  stamp_type    VARCHAR  -- great / thanks / cute / love / star
  message       TEXT NULL
```

---

## E2Eテスト

Playwright を使用した E2E テストが 8 シナリオ・**60 テストケース**実装済みで、全て PASS しています。

```bash
# バックエンドを起動してから実行
make backend-run &
make e2e
```

Playwright は自動的に port 3001 でフロントエンドを起動します。

| ファイル | テスト対象 | ケース数 |
|---|---|---|
| `01-auth.spec.ts` | ログイン・登録・ログアウト・未認証リダイレクト | 7 |
| `02-tasks.spec.ts` | タスク作成・完了・編集・削除・テンプレート・バリデーション | 12 |
| `03-notifications.spec.ts` | 通知一覧・スタンプ絵文字・ナビゲーション | 4 |
| `04-dashboard.spec.ts` | グラフ・タイムライン・目標追加・レイアウト | 8 |
| `05-profile.spec.ts` | プロフィール表示・編集・ポイント・招待コード | 10 |
| `06-navigation.spec.ts` | BottomNav・Sidebar・全ページ遷移 | 11 |
| `07-family-setup.spec.ts` | グループ作成・参加・招待コード検証 | 4 |
| `08-appreciation.spec.ts` | ママ→パパ・パパ→ママ スタンプ送信 | 4 |

---

## 環境変数

### バックエンド（`.envrc`）

```bash
export SERVER_PORT=1099

export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=rootpassword
export DB_ROOT_PASSWORD=rootpassword
export DB_NAME=app_db

# 本番では必ず 32文字以上のランダム文字列に変更
export JWT_SECRET_KEY=change-me-please-use-32chars-or-more
```

### フロントエンド（`frontend/.env.local`）

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:1099
```

> **iOS 実機ビルド時**: `NEXT_PUBLIC_API_BASE_URL` を本番 API の URL に変更してからビルドしてください。

---

## シードデータ

`make db-reset` または `make db-setup` を実行すると以下のデータが投入されます。

### 田中家（招待コード: `TANAKA000001`）

| ユーザー | メール | 役割 | 円満ポイント |
|---|---|---|---|
| タカシ | `papa@tanaka.example` | パパ | 18pt |
| ユミ | `mama@tanaka.example` | ママ | 26pt |
| ハルト | `haruto@tanaka.example` | 長男 | 8pt |
| サクラ | `sakura@tanaka.example` | 長女 | 5pt |

全員のパスワード: `password123`

### タスクテンプレート（18件）

| カテゴリー | テンプレート名 |
|---|---|
| キッチン | 皿洗い・料理・食材買い出し |
| ゴミ | ゴミ出し・ゴミ袋セット |
| 掃除 | 掃除機がけ・トイレ掃除・お風呂掃除・床拭き掃除 |
| 洗濯 | 洗濯・洗濯物の干し・洗濯物の取り込み・アイロンがけ |
| 育児 | お風呂・寝かしつけ |
| その他 | 保育園の準備・電球の交換・郵便物の確認 |

### ご褒美目標

- **週末みんなで焼肉🥩**（目標: 80pt、現在: 57pt）

---

## iOS対応

Next.js の静的書き出し（`output: 'export'`）+ Capacitor で iOS アプリ化します。

```bash
# 初回のみ: iOS プロジェクトを作成
cd frontend && npx cap add ios

# 本番 API URL をセットしてビルド・同期
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com make frontend-build
make ios-sync

# Xcode で開く
cd frontend && npx cap open ios
```

### iOS で禁止されている API と代替手段

| 禁止 | 理由 | 代替 |
|---|---|---|
| `window.location.href` の直接書き換え | WKWebView で不安定 | `router.push()` |
| `localStorage` の大容量保存 | 容量制限あり | `@capacitor/preferences` |
| `alert()` / `confirm()` | UI がブロックされる | カスタムモーダル |
| `navigator.geolocation` | iOS 許可ダイアログが必要 | `@capacitor/geolocation` |

> **iOS シミュレーターは `http://localhost:1099` に接続できます。**  
> 実機では必ず本番 URL または LAN 上の IP アドレスを使用してください。
