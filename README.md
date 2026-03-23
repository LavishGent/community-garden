# 🌱 Community Garden

> A real-time, multiplayer garden simulation — a distributed coordination system disguised as a game.

Players share a **5×5 plot grid** and race against entropy to keep their crops alive. The garden degrades continuously; only coordinated watering, weeding, planting, and harvesting keeps the score climbing. Every state change is server-authoritative and pushed to all connected clients over WebSockets in real time.

---

## ⚙️ Tech Stack

| Layer     | Technology |
|-----------|------------|
| Backend   | Go · `gorilla/websocket` · Redis (optional persistence) |
| Frontend  | React 19 + TypeScript · Vite · Tailwind CSS · React-Konva |
| Infra     | Docker Compose (local Redis) · Fly.io (production) |

---

## 🏗️ Architecture

```
React Client(s)
     │  WebSocket (JSON)
     ▼
Go HTTP Server (:8080)
     │
     ▼
WebSocket Hub ──── broadcast channel ────▶ all clients
     │
     ▼
Garden Engine  (single goroutine — no mutexes)
     ├── Event Queue     (buffered channel)
     ├── Decay Ticker    (1 s)
     └── Broadcast Ticker (1 ms)
     │
     ▼
Redis Store  (optional — snapshot + restore on restart)
```

The engine runs as an **actor**: all state mutations happen on one goroutine, eliminating races by design. Redis is used purely for snapshotting; the authoritative state always lives in memory.

---

## 🧱 Project Structure

```
community-garden/
├── justfile                     # dev, build, test, deploy commands
├── docker-compose.yml           # local Redis
│
├── backend/
│   ├── cmd/server/main.go       # entrypoint, wiring
│   ├── internal/
│   │   ├── engine/
│   │   │   ├── engine.go        # event loop, decay + broadcast tickers
│   │   │   ├── models.go        # Garden, Plot, CropProfile types
│   │   │   └── logic.go         # action & decay handlers
│   │   ├── ws/
│   │   │   ├── handler.go       # WebSocket upgrader
│   │   │   ├── client.go        # per-connection read / write pumps
│   │   │   └── hub.go           # fan-out broadcast hub
│   │   └── store/
│   │       └── redis.go         # snapshot persistence
│   └── go.mod
│
└── frontend/
    ├── src/
    │   ├── App.tsx              # root — WebSocket wiring, layout
    │   ├── hooks/useSocket.ts   # connect, parse STATE / ERROR
    │   └── components/
    │       ├── Garden.tsx       # 5×5 Konva canvas grid
    │       ├── Plot.tsx         # sprite + stat bars + action buttons
    │       └── cropSprites.ts   # 16×16 pixel-art sprite data
    └── package.json
```

---

## 🌿 Domain Model

### Garden

A **5×5 grid** of 25 plots (IDs `A1`–`E5`) plus a running score.

```go
type Garden struct {
    Plots map[string]*Plot
    Score uint64
}
```

`Score` accumulates as players harvest crops.

### Plot

```go
type Plot struct {
    ID        string
    Crop      CropType  // NONE | CORN | WHEAT | COTTON | STRAWBERRY
    Growth    float64   // 0-100
    Hydration float64   // 0-100
    Weeds     float64   // 0-100
    Health    float64   // 0-100 (derived: clamp(Hydration - Weeds, 0, 100))
    Occupied  bool
    Version   int       // optimistic concurrency token
}
```

### Crop Profiles

| Crop           | ThirstRate | WeedSusceptibility | GrowthRate | HarvestScore |
|----------------|------------|---------------------|------------|--------------|
| Corn           | 0.5        | 0.10                | 0.8        | 1            |
| Wheat          | 0.1        | 0.05                | 0.4        | 2            |
| Cotton         | 0.2        | 0.25                | 0.4        | 3            |
| Strawberry     | 0.6        | 0.40                | 1.2        | 4            |

---

## 🔁 Simulation Engine

The engine runs as a Go **actor** — a single goroutine that owns all garden state. No mutexes, no races. Clients submit `Event` structs onto a buffered channel; the engine processes them one at a time.

```go
for {
    select {
    case event := <-e.events:   // player action
        e.handleEvent(event)
    case <-decayTicker.C:       // every 1 s  — degrade all plots
        e.applyDecayAll()
    case <-broadcastTicker.C:   // every 1 ms — push state to all clients
        e.BroadcastState()
    }
}
```

### Decay (per occupied plot, every second)

```
Hydration -= crop.ThirstRate
Weeds     += crop.WeedSusceptibility
Health     = clamp(Hydration - Weeds, 0, 100)
if Health > 0 { Growth += crop.GrowthRate }
```

### Actions

| Action    | Precondition                     | Effect |
|-----------|----------------------------------|--------|
| `WATER`   | Occupied, alive, not full        | `Hydration += 20`, recalculate Health |
| `WEED`    | Occupied, alive, weeds > 0       | `Weeds -= 2`, recalculate Health |
| `PLANT`   | Empty or dead crop               | Reset all stats to 100/0/100/0 |
| `HARVEST` | `Growth == 100` and `Health > 0` | Add `HarvestScore` to Score, clear plot |
| `REMOVE`  | `Health == 0`                    | Clear plot, reset to neutral (Hydration 50) |

### Optimistic Concurrency

Every client message carries the `version` it last observed. If `event.Version != plot.Version`, the engine rejects the action with an `ERROR` message, preventing stale writes from clobbering concurrent updates. On a successful action `plot.Version` is incremented.

---

## 📡 WebSocket Protocol

**Client to Server**

```json
{ "type": "WATER",   "plotId": "A1", "version": 3 }
{ "type": "WEED",    "plotId": "B2", "version": 7 }
{ "type": "PLANT",   "plotId": "C3", "version": 0, "crop": "CORN" }
{ "type": "HARVEST", "plotId": "D4", "version": 12 }
{ "type": "REMOVE",  "plotId": "E5", "version": 5 }
```

**Server to Client**

```json
{ "type": "STATE", "garden": { "plots": { "A1": { ... } }, "score": 42 } }
{ "type": "ERROR", "message": "version_conflict" }
```

---

## 🚀 Quick Start

### Prerequisites

- Go 1.21+
- Node.js 20+
- Docker (for local Redis) — optional
- [just](https://github.com/casey/just) — optional but recommended

### With `just` (recommended)

```bash
# Backend + Redis (hot-reload via air)
just dev

# Backend only, no Redis
just dev-no-redis

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

### Without `just`

```bash
# Terminal 1 — backend
cd backend
go mod tidy
REDIS_URL=redis://localhost:6379 go run cmd/server/main.go
# omit REDIS_URL to run fully in-memory

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

| Service   | URL |
|-----------|-----|
| Backend   | `http://localhost:8080` |
| Frontend  | `http://localhost:5173` |

---

## 🔮 Roadmap

- [ ] User accounts + persistent leaderboards
- [ ] Multi-server support via Redis Pub/Sub
- [ ] Seasonal resets / community events
- [ ] Spectator mode / replay
