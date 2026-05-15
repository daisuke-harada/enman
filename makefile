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
	@trap 'kill 0' INT TERM; \
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

# ── iOS (Capacitor) ──────────────────────────────────────────────────────────

ios-sync:
	cd frontend && npm run build && npx cap sync ios

# ── Docker ───────────────────────────────────────────────────────────────────

docker-up:
	docker compose up -d
	docker compose exec db bash -c 'until mysqladmin ping -u "${DB_USER}" -p"${DB_PASSWORD}" --silent 2>/dev/null; do sleep 1; done'
