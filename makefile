# ── Setup ────────────────────────────────────────────────────────────────────

# 依存インストール・コード生成・DB構築・Seedまで全て実行（初回のみ）
setup: backend-deps frontend-install gen docker-up backend-apply-schema backend-db-seed

# DBをゼロから構築してSeedを投入（初回 or データをリセットしたいとき）
db-setup: docker-up backend-apply-schema backend-db-seed

# DBを完全リセットして再構築（テーブル・データを全て消してやり直す）
db-reset: docker-up backend-db-drop backend-apply-schema backend-db-seed

# ── Dev Server ────────────────────────────────────────────────────────────────

# バックエンド (port 1099) とフロントエンド (port 3000) を同時起動
# Ctrl+C で両方まとめて停止する
dev: docker-up
	@echo "🚀 Starting API (port 1099) and Web (port 3000) ..."
	@cleanup() { \
		echo ""; \
		lsof -ti:1099 | xargs kill -TERM 2>/dev/null; \
		lsof -ti:3000 | xargs kill -TERM 2>/dev/null; \
		kill 0 2>/dev/null; \
	}; \
	trap cleanup INT TERM; \
	$(MAKE) -C backend run 2>&1 | sed 's/^/[API] /' & \
	npm --prefix frontend run dev 2>&1 | sed 's/^/[WEB] /' & \
	wait

# ── Code Generation (OpenAPI → Go + TypeScript) ───────────────────────────────

gen: backend-gen frontend-gen

# ── Backend ───────────────────────────────────────────────────────────────────

backend-deps:
	$(MAKE) -C backend deps

backend-gen:
	$(MAKE) -C backend gen

backend-run:
	$(MAKE) -C backend run

backend-test:
	$(MAKE) -C backend test

backend-lint:
	$(MAKE) -C backend lint

backend-apply-schema:
	$(MAKE) -C backend apply-schema

backend-db-seed:
	$(MAKE) -C backend db-seed

backend-db-drop:
	$(MAKE) -C backend db-drop

# ── Frontend ─────────────────────────────────────────────────────────────────

frontend-install:
	npm --prefix frontend install

frontend-gen:
	npm --prefix frontend run gen

frontend-dev:
	npm --prefix frontend run dev

frontend-build:
	npm --prefix frontend run build

# ── E2E テスト (Playwright) ───────────────────────────────────────────────────

# E2Eテストを実行（バックエンドが port 1099 で起動済みであること）
# Playwright が port 3001 でフロントエンドを自動起動する
e2e: docker-up
	npm --prefix frontend run e2e

# 特定のファイルだけ実行: make e2e FILE=e2e/01-auth.spec.ts
e2e-file: docker-up
	npm --prefix frontend exec -- playwright test $(FILE)

# テスト結果レポートをブラウザで確認
e2e-report:
	npm --prefix frontend run e2e:report

# インタラクティブUIモードで実行（デバッグ用）
e2e-ui:
	npm --prefix frontend exec -- playwright test --ui

# ── iOS (Capacitor) ──────────────────────────────────────────────────────────

ios-sync:
	cd frontend && npm run build && npx cap sync ios

# ── Docker ───────────────────────────────────────────────────────────────────

docker-up:
	docker compose up -d
	docker compose exec db bash -c 'until mysqladmin ping -u "${DB_USER}" -p"${DB_PASSWORD}" --silent 2>/dev/null; do sleep 1; done'
