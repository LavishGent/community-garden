# 🌱 Community Garden — Backend

Go WebSocket server for the Community Garden real-time multiplayer simulation.

---

## Tech Stack

- **Go** — HTTP server, WebSocket handling
- **gorilla/websocket** — WebSocket upgrader and read/write pumps
- **Redis** (`go-redis/v9`) — optional state snapshot + pub/sub for multi-instance coordination
- **Fly.io** — production deployment

---

## Architecture

```
cmd/server/main.go
       │
       ├── ws.Hub          — fan-out broadcast to all connected clients
       ├── GardenEngine    — single-goroutine actor; owns all garden state
       └── store.RedisStore — optional snapshot + pub/sub (nil-safe)
```

The engine is an **actor**: every state mutation happens on one goroutine.  
No mutexes. No data races. The event loop selects on three channels:

| Channel / ticker  | Period  | Purpose |
|-------------------|---------|---------|
| `events`          | on demand | Process a player action |
| `decayTicker`     | 1 s       | Degrade all occupied plots |
| `broadcastTicker` | 1 ms      | Serialize and push `STATE` to all clients |

---

## Project Structure

```
backend/
├── cmd/server/main.go        # Entrypoint — wires hub, engine, HTTP handler
├── internal/
│   ├── engine/
│   │   ├── engine.go         # Engine struct, event loop, broadcast, persistence
│   │   ├── models.go         # Garden, Plot, CropProfile, Event types
│   │   └── logic.go          # Action handlers (WATER, WEED, PLANT, HARVEST, REMOVE) + decay
│   ├── ws/
│   │   ├── handler.go        # /ws HTTP handler — upgrades to WebSocket
│   │   ├── client.go         # Per-connection read pump (inbound) + write pump (outbound)
│   │   └── hub.go            # Broadcast hub — registers/unregisters clients, fans out messages
│   └── store/
│       └── redis.go          # SaveState / LoadState / Publish via Redis
├── fly.toml                  # Fly.io app config (app: backend-purple-darkness-9987)
└── go.mod
```

---

## Environment Variables

| Variable    | Required | Description |
|-------------|----------|-------------|
| `REDIS_URL` | No       | Redis connection string, e.g. `redis://localhost:6379`. Omit to run fully in-memory. |

---

## Running Locally

**With Redis (recommended):**

```bash
# Start Redis via Docker Compose (from repo root)
docker compose up -d redis

# Run the server with hot-reload (requires air)
REDIS_URL=redis://localhost:6379 air

# Or without hot-reload
REDIS_URL=redis://localhost:6379 go run cmd/server/main.go
```

**Without Redis (in-memory only):**

```bash
go run cmd/server/main.go
```

Server listens on `:8080` by default. Override with `-addr`:

```bash
go run cmd/server/main.go -addr :9090
```

---

## Common Commands

```bash
# Build binary
go build -o main ./cmd/server/

# Run tests
go test ./...

# Run vet
go vet ./...
```

Or use `just` from the repo root:

```bash
just dev          # Redis + hot-reload
just dev-no-redis # In-memory only
just build
just test
just lint
```

---

## Deployment (Fly.io)

```bash
# Deploy
fly deploy

# Tail production logs
fly logs --app backend-purple-darkness-9987

# Connect to production Redis
fly redis connect

# Set Redis secret
fly secrets set REDIS_URL=redis://...
```
