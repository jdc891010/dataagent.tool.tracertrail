# Makefile for dataagent.tool.tracertrail
#
# This Makefile provides commands for CI/CD pipelines and local development.
# It wraps npm scripts and Playwright commands for the 'tracertrail' application.

# Configuration
APP_DIR := tracertrail
NPM := npm
PLAYWRIGHT := npx playwright

# Docker Configuration
DOCKER_IMAGE_NAME := tracertrail-app
DOCKER_CONTAINER_NAME := tracertrail-container
DOCKER_PORT := 8081
DOCKER_VOL := $(CURDIR)/tmp


# Default target
.PHONY: all
all: install lint test build

# Help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  make install         - Install dependencies"
	@echo "  make lint            - Run code quality checks (ESLint)"
	@echo "  make test            - Run end-to-end tests (Playwright headless)"
	@echo "  make test-ui         - Run tests in UI mode"
	@echo "  make test-debug      - Run tests in debug mode"
	@echo "  make test-headed     - Run tests in headed mode"
	@echo "  make test-report     - View test report"
	@echo "  make test-unit       - Run unit tests (if configured)"
	@echo "  make build           - Build the application for production"
	@echo "  make clean           - Remove build artifacts and dependencies"
	@echo "  make release-patch   - Bump version (patch) and update package.json"
	@echo "  make release-minor   - Bump version (minor) and update package.json"
	@echo "  make release-major   - Bump version (major) and update package.json"
	@echo "  make ci              - Run full CI pipeline (install, lint, test, build)"
	@echo "  make docker-build    - Build Docker image"
	@echo "  make docker-run      - Run Docker container"
	@echo "  make docker-stop     - Stop Docker container"
	@echo "  make docker-rm       - Remove Docker container"
	@echo "  make docker-clean    - Remove Docker container and image"
	@echo "  make docker-logs     - View Docker container logs"
	@echo "  make docker-shell    - Open shell in Docker container"

# Install dependencies
.PHONY: install
install:
	@echo "Installing dependencies in $(APP_DIR)..."
	cd $(APP_DIR) && $(NPM) install

# Linting
.PHONY: lint
lint:
	@echo "Running linter..."
	cd $(APP_DIR) && $(NPM) run lint

# Testing
.PHONY: test
test:
	@echo "Running Playwright tests (headless)..."
	cd $(APP_DIR) && $(PLAYWRIGHT) install --with-deps
	cd $(APP_DIR) && $(PLAYWRIGHT) test

.PHONY: test-ui
test-ui:
	@echo "Running Playwright tests (UI mode)..."
	cd $(APP_DIR) && $(PLAYWRIGHT) test --ui

.PHONY: test-debug
test-debug:
	@echo "Running Playwright tests (debug mode)..."
	cd $(APP_DIR) && $(PLAYWRIGHT) test --debug

.PHONY: test-headed
test-headed:
	@echo "Running Playwright tests (headed mode)..."
	cd $(APP_DIR) && $(PLAYWRIGHT) test --headed

.PHONY: test-report
test-report:
	@echo "Opening Playwright test report..."
	cd $(APP_DIR) && $(PLAYWRIGHT) show-report

.PHONY: test-unit
test-unit:
	@echo "Running unit tests..."
	@echo "Note: Unit testing framework (e.g., Vitest/Jest) not yet configured."
	# cd $(APP_DIR) && $(NPM) run test:unit


# Building
.PHONY: build
build:
	@echo "Building application..."
	cd $(APP_DIR) && $(NPM) run build

# Cleaning
.PHONY: clean
clean:
	@echo "Cleaning up..."
	cd $(APP_DIR) && rm -rf dist node_modules test-results
	@echo "Cleanup complete."

# Releases
.PHONY: release-patch
release-patch:
	@echo "Releasing patch version..."
	cd $(APP_DIR) && $(NPM) run release:patch

.PHONY: release-minor
release-minor:
	@echo "Releasing minor version..."
	cd $(APP_DIR) && $(NPM) run release:minor

.PHONY: release-major
release-major:
	@echo "Releasing major version..."
	cd $(APP_DIR) && $(NPM) run release:major

.PHONY: ci
ci: install lint test build
	@echo "CI pipeline completed successfully."

# Docker
.PHONY: docker-build
docker-build:
	@echo "Building Docker image $(DOCKER_IMAGE_NAME)..."
	docker build -t $(DOCKER_IMAGE_NAME) .

.PHONY: docker-run
docker-run:
	@echo "Running Docker container $(DOCKER_CONTAINER_NAME)..."
	@mkdir -p $(DOCKER_VOL)
	docker run -d -p $(DOCKER_PORT):80 --name $(DOCKER_CONTAINER_NAME) -v "$(DOCKER_VOL):/app/tracertrail/server/storage" $(DOCKER_IMAGE_NAME)
	@echo "App running at http://localhost:$(DOCKER_PORT)"

.PHONY: docker-stop
docker-stop:
	@echo "Stopping Docker container..."
	-docker stop $(DOCKER_CONTAINER_NAME)

.PHONY: docker-rm
docker-rm: docker-stop
	@echo "Removing Docker container..."
	-docker rm $(DOCKER_CONTAINER_NAME)

.PHONY: docker-clean
docker-clean: docker-rm
	@echo "Removing Docker image..."
	-docker rmi $(DOCKER_IMAGE_NAME)

.PHONY: docker-logs
docker-logs:
	docker logs -f $(DOCKER_CONTAINER_NAME)

.PHONY: docker-shell
docker-shell:
	docker exec -it $(DOCKER_CONTAINER_NAME) /bin/sh

