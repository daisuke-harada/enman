# ── Setup ────────────────────────────────────────────────────────────────────

setup: backend-deps frontend-install gen docker-up backend-apply-schema backend-db-seed

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
