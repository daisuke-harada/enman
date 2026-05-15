gen: openapi-generate go-generate

deps:
	go mod download

openapi-generate:
	bash scripts/openapi-generator-cli.sh

go-generate: mock-generate
	go generate ./internal/interface/openapi

mock-generate: mock-repository mock-service mock-usecase

mock-repository:
	mkdir -p internal/domain/repository/mock
	@for f in internal/domain/repository/*.go; do \
		[ -e "$$f" ] || continue; \
		mockgen -source=$$f -destination=internal/domain/repository/mock/$$(basename $$f) -package=repositorymock; \
	done

mock-service:
	mkdir -p internal/domain/service/mock
	@for f in internal/domain/service/*.go; do \
		[ -e "$$f" ] || continue; \
		mockgen -source=$$f -destination=internal/domain/service/mock/$$(basename $$f) -package=servicemock; \
	done

mock-usecase:
	mkdir -p internal/usecase/mock
	@for f in internal/usecase/*.go; do \
		case $$f in *_test.go) continue;; esac; \
		[ -e "$$f" ] || continue; \
		mockgen -source=$$f -destination=internal/usecase/mock/$$(basename $$f) -package=usecasemock; \
	done

test:
	go test ./...

lint:
	golangci-lint run ./...

run:
	go run ./cmd/api/main.go

apply-schema:
	mysqldef -u "${DB_USER}" -p "${DB_PASSWORD}" -h "${DB_HOST}" -P "${DB_PORT}" "${DB_NAME}" < ./internal/infrastructure/db/schema.sql

db-seed:
	go run ./tools/seed/main.go

db-drop:
	docker compose exec db mysql -u "${DB_USER}" -p"${DB_PASSWORD}" -e "DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME};"
