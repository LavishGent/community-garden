# Community Garden - Development Commands

# Start Redis and the backend with hot-reload
dev: redis-up
    cd backend && REDIS_URL=redis://localhost:6379 air

# Start the backend without Redis (in-memory only)
dev-no-redis:
    cd backend && air

# Start Redis in the background
redis-up:
    docker compose up -d redis

# Stop Redis
redis-down:
    docker compose down

# Flush local Redis state (useful for a clean slate)
redis-flush:
    docker compose exec redis redis-cli FLUSHALL

# Build the backend binary
build:
    cd backend && go build -o main ./cmd/server/

# Run tests
test:
    cd backend && go test ./...

# Run go vet
lint:
    cd backend && go vet ./...

# Deploy to Fly.io
deploy:
    cd backend && fly deploy

# Tail production logs
logs:
    fly logs --app backend-purple-darkness-9987

# Open a Redis CLI against production
redis-prod:
    fly redis connect
