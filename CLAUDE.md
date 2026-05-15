# CLAUDE.md

## プロジェクト概要

Go (Echo/GORM) + Next.js 15 のフルスタックテンプレート。
**Web ブラウザと iOS アプリ（Capacitor）の両方で動作する**ことを前提に設計する。

```
fullstack-template/
├── backend/    Go バックエンド (port 1099)
├── frontend/   Next.js → Capacitor で iOS アプリ化
└── makefile    全タスクのエントリーポイント
```

詳細な実装規約は `.claude/CLAUDE.md` を参照。

---

## コマンド早見表

| コマンド | 説明 |
|---|---|
| `make gen` | OpenAPI → Go コード + TypeScript 型を同時生成 |
| `make backend-run` | Go サーバー起動（port 1099） |
| `make frontend-dev` | Next.js 開発サーバー起動（port 3000） |
| `make frontend-build` | 静的書き出し（`frontend/out/` に出力） |
| `make ios-sync` | ビルド → Capacitor iOS プロジェクトへ同期 |

---

## iOS 対応の重要ルール

### 1. ブラウザ専用 API は使用禁止
Capacitor（iOS）では以下の API が使えない・動作が異なる。
代替手段を必ず使うこと。

| 禁止 / 注意 | 理由 | 代替 |
|---|---|---|
| `window.location.href` の直接書き換え | WKWebView での挙動が不安定 | Next.js `router.push()` を使う |
| `navigator.geolocation` | iOS は許可ダイアログが必要 | `@capacitor/geolocation` |
| `localStorage` の大容量保存 | 容量制限あり | `@capacitor/preferences` |
| `fetch` での `file://` スキーム | CORS エラー | Capacitor の `CapacitorHttp` |
| `alert()` / `confirm()` | WKWebView で UI がブロックされる | カスタムモーダルを実装 |

### 2. API 接続先は必ず環境変数で切り替える

静的書き出し（`next build`）では環境変数はビルド時に確定する。
実機・本番向けのビルドでは必ず `NEXT_PUBLIC_API_BASE_URL` を設定してからビルドする。

```
開発（ブラウザ）: NEXT_PUBLIC_API_BASE_URL=http://localhost:1099
iOS シミュレーター: NEXT_PUBLIC_API_BASE_URL=http://localhost:1099  ← 同じで動く
iOS 実機:          NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com  ← 必ず本番 URL
```

> **NG:** `localhost` を実機向けビルドに使うと接続できない。
> **NG:** コード内に URL をハードコードしない。

### 3. 静的書き出しの制約を意識する

`next.config.ts` で `output: 'export'` が固定設定のため、以下は使えない。

- `getServerSideProps` / `getStaticPaths` での動的ルート（`generateStaticParams` で代替）
- Next.js の API Routes（`/app/api/` 以下）
- `next/image` のデフォルト最適化（`unoptimized: true` で回避済み）
- サーバーコンポーネントでの直接 fetch（クライアントサイドで `useQuery` を使う）

### 4. iOS ビルドフロー

```sh
# 1. 本番 API URL をセットしてビルド
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com make frontend-build

# 2. Capacitor iOS プロジェクトへ同期
make ios-sync

# 3. Xcode で開く
cd frontend && npx cap open ios
```

---

## API 更新フロー（OpenAPI ファースト）

```
1. api/OpenAPI.yaml を編集
2. make gen  →  Go コード + TypeScript 型を同時生成
3. frontend/src/hooks/ のフックを更新
4. ブラウザで動作確認 → iOS シミュレーターで確認
```
