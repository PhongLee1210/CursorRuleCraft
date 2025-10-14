# CursorRuleCraft Docker Makefile
# Quick commands for Docker operations

.PHONY: help docker-build docker-up docker-down docker-restart docker-logs docker-clean docker-ps

help: ## Show this help message
	@echo "CursorRuleCraft Docker Commands"
	@echo "================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Docker Compose commands
docker-build: ## Build all Docker images
	docker-compose --env-file .env.docker build

docker-up: ## Start all services in detached mode
	docker-compose --env-file .env.docker up -d

docker-up-build: ## Build and start all services
	docker-compose --env-file .env.docker up -d --build

docker-up-fg: ## Start all services in foreground (see logs)
	docker-compose --env-file .env.docker up

docker-down: ## Stop all services
	docker-compose down

docker-restart: ## Restart all services
	docker-compose restart

docker-logs: ## View logs from all services (follow mode)
	docker-compose logs -f

docker-logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

docker-logs-backend: ## View backend logs
	docker-compose logs -f backend

docker-ps: ## Show running containers
	docker-compose ps

docker-clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v
	docker system prune -f

# Individual service commands
docker-rebuild-frontend: ## Rebuild and restart frontend only
	docker-compose build frontend
	docker-compose up -d frontend

docker-rebuild-backend: ## Rebuild and restart backend only
	docker-compose build backend
	docker-compose up -d backend

# Health checks
docker-health: ## Check health of all services
	@echo "Frontend health:"
	@curl -f http://localhost/health || echo "❌ Frontend is not healthy"
	@echo "\nBackend health:"
	@curl -f http://localhost/api/health || echo "❌ Backend is not healthy"

# Database commands
docker-db-shell: ## Access PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d cursorrulecraft

docker-db-backup: ## Backup database
	docker-compose exec postgres pg_dump -U postgres cursorrulecraft > backup_$$(date +%Y%m%d_%H%M%S).sql

# Environment setup
setup-env: ## Copy example env file
	@if [ ! -f .env.docker ]; then \
		cp env.docker.example .env.docker; \
		echo "✅ Created .env.docker from example"; \
		echo "⚠️  Please edit .env.docker with your values"; \
	else \
		echo "⚠️  .env.docker already exists"; \
	fi

# Quick start
quickstart: setup-env docker-up-build ## Setup and start everything (first-time setup)
	@echo "================================"
	@echo "✅ CursorRuleCraft is starting!"
	@echo "Frontend: http://localhost"
	@echo "Backend API: http://localhost/api"
	@echo "================================"
	@echo "View logs with: make docker-logs"

