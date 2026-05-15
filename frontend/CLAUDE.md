# CLAUDE.md — Frontend (Next.js + Capacitor)

## 概要

- **Stack:** Next.js 15 (App Router), Tailwind CSS, TanStack Query v5, Axios, Capacitor
- **出力:** 静的書き出し（`out/`）→ Capacitor 経由で iOS アプリ化
- **API:** OpenAPI スキーマ駆動。型は `api/resolved/openapi/openapi.yaml` から自動生成。

## コマンド（frontend/ ディレクトリ内で実行）

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動（port 3000） |
| `npm run build` | 静的書き出し（`out/` に出力） |
| `npm run preview` | 静的ビルドをローカルでプレビュー |
| `npm run gen` | TypeScript 型生成（`make gen` 経由を推奨） |
| `npx cap sync ios` | ビルド後に iOS プロジェクトへ同期 |
| `npx cap open ios` | Xcode を開く |
| `npx cap add ios` | iOS プロジェクトを初回作成（1回だけ実行） |

## 環境変数

`.env.local.example` をコピーして `.env.local` を作成する。

```sh
cp .env.local.example .env.local
```

| 変数 | 説明 |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Go バックエンドの URL |

> **重要:** 静的書き出しでは環境変数はビルド時に確定する。
> iOS 実機向けビルドでは `localhost` ではなく本番 URL を設定してからビルドする。

## ディレクトリ構成

```
frontend/
├── capacitor.config.ts   # Capacitor 設定（appId・appName を変更すること）
├── src/
│   ├── api-client/       # 自動生成 — 直接編集禁止（make gen で再生成）
│   ├── app/              # Next.js App Router ページ
│   │   └── providers.tsx # QueryClientProvider + axios 初期化
│   ├── hooks/            # API フック（useQuery / useMutation ラッパー）
│   └── lib/
│       ├── api-client.ts # axios baseURL 設定
│       └── query-client.ts
├── out/                  # next build の出力先（gitignore 済み）
└── ios/                  # Capacitor iOS プロジェクト（gitignore 済み）
```

## 実装規約

1. **API 呼び出し:** `src/api-client/` をコンポーネントで直接呼ばない。`src/hooks/` で `useQuery` / `useMutation` にラップする。
2. **型定義:** `src/api-client/types.gen.ts` の型を再利用し、手動定義を最小限に抑える。
3. **ブラウザ専用 API 禁止:** `window`・`navigator`・`localStorage` の直接操作は iOS で動作しない場合がある。Capacitor プラグインを使うか、`typeof window !== 'undefined'` でガードする。
4. **スタイリング:** Tailwind CSS でモバイルファースト設計（`sm:` より先に基本スタイルを書く）。

## iOS 開発フロー

```sh
# 初回のみ: iOS プロジェクトを作成
cd frontend && npx cap add ios

# 通常の開発サイクル
make frontend-build        # 静的書き出し
make ios-sync              # Capacitor iOS へ同期（= make frontend-build + cap sync ios）
cd frontend && npx cap open ios  # Xcode で開いて実機/シミュレーターで確認
```

## API 更新フロー（OpenAPI ファースト）

```
1. api/OpenAPI.yaml を編集
2. make gen（ルートで実行）→ Go コード + TypeScript 型を同時生成
3. src/hooks/ のフックを更新
4. ブラウザ → iOS シミュレーターの順で動作確認
```
