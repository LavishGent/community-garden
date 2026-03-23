# 🌱 Community Garden (Real-Time Multiplayer Simulation)

## 🧠 Overview

This project is a **real-time, multiplayer community garden simulation** where users collaboratively maintain a shared garden.

* The garden **degrades over time**
* Users perform actions to **keep it alive**
* All updates happen **in real time via WebSockets**
* The system is **server-authoritative** and runs entirely **in memory**

---

## 🎯 Goals

* Learn **real-time systems**
* Practice **Go concurrency patterns (actor model)**
* Build **event-driven architecture**
* Avoid premature complexity (no DB for MVP)

---

## 🏗️ Architecture

```
React Client(s)
     ↓ WebSocket
Go WebSocket Server
     ↓
Garden Engine (single goroutine)
     ├── State (garden + plots)
     ├── Event Queue (buffered channel)
     ├── Decay Ticker (1s)
     └── Broadcast Ticker (1ms)
```

---

## ⚙️ Tech Stack

### Backend

* Go
* WebSockets (`gorilla/websocket`)
* In-memory state (no database)

### Frontend

* React 19 + TypeScript (Vite)
* Tailwind CSS
* React-Konva (canvas rendering with pixel-art crop sprites)
* WebSocket client

---

## 🧱 Project Structure

```
community-garden/
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── engine/
│   │   │   ├── engine.go     # engine loop, event dispatch, broadcast
│   │   │   ├── models.go     # types, crop profiles, garden/plot init
│   │   │   └── logic.go      # action & decay handlers
│   │   └── ws/
│   │       ├── handler.go    # WebSocket upgrader
│   │       ├── client.go     # per-connection read/write pumps
│   │       └── hub.go        # broadcast hub
│   └── go.mod
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── hooks/useSocket.ts
│   │   └── components/
│   │       ├── Garden.tsx
│   │       ├── Plot.tsx
│   │       └── cropSprites.ts  # pixel-art sprite data (16×16)
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🌿 Domain Model

### Garden

The garden is a **5×5 grid** of 25 plots (IDs: A1–E5).

```
type Garden struct {
    Plots map[string]*Plot
    Score uint64
}
```

`Score` accumulates as players harvest crops.

---

### Plot

```
type Plot struct {
    ID        string
    Crop      CropType  // NONE | CORN | WHEAT | COTTON | STRAWBERRY
    Growth    float64   // 0–100
    Hydration float64   // 0–100
    Weeds     float64   // 0–100
    Occupied  bool
    Health    float64   // 0–100
    Version   int       // optimistic concurrency token
}
```

---

### Crop Profiles

Each crop has a unique profile that governs its simulation behaviour:

| Crop       | ThirstRate | WeedSusceptibility | GrowthRate | HarvestScore |
|------------|------------|-------------------|------------|--------------|
| Corn       | 0.5        | 0.10              | 0.8        | 1            |
| Wheat      | 0.1        | 0.05              | 0.4        | 2            |
| Cotton     | 0.2        | 0.25              | 0.4        | 3            |
| Strawberry | 0.6        | 0.40              | 1.2        | 4            |

---

### Event

```
type Event struct {
    Type    EventType     // WATER | WEED | PLANT | HARVEST | REMOVE
    PlotID  string
    Crop    CropType
    Version int           // must match plot's current version
    Reply   chan<- []byte // engine sends errors back on this channel
}
```

---

## 🔁 Simulation Engine

### Core Concept

The entire game state lives inside a **single goroutine** — no mutexes, no race conditions, deterministic updates.

---

### Event Loop

```go
func (e *GardenEngine) Run() {
    broadcastTicker := time.NewTicker(1 * time.Millisecond)
    decayTicker     := time.NewTicker(1 * time.Second)

    for {
        select {
        case event := <-e.events:
            e.handleEvent(event)
        case <-decayTicker.C:
            e.applyDecayAll()
        case <-broadcastTicker.C:
            e.BroadcastState()
        }
    }
}
```

---

### Optimistic Concurrency

Every event must carry the plot's current `Version`. If it doesn't match, the engine rejects the action with an `ERROR` message. This prevents stale actions from clobbering concurrent updates.

---

## ⏱️ Simulation Rules

### Decay (every second, per occupied plot)

Each tick applies the crop's profile values:

```
plot.Hydration -= crop.ThirstRate
plot.Weeds     += crop.WeedSusceptibility
plot.Health     = clamp(plot.Hydration - plot.Weeds, 0, 100)
```

Growth only advances while the crop is alive (`Health > 0`):

```
plot.Growth += crop.GrowthRate
```

---

### Actions

#### WATER
Raises hydration by 20 (no-op if already full or crop is dead):
```
plot.Hydration += 20
plot.Health     = clamp(plot.Hydration - plot.Weeds, 0, 100)
```

#### WEED
Reduces weeds by 2 (no-op if weeds are 0 or crop is dead):
```
plot.Weeds  -= 2
plot.Health  = clamp(plot.Hydration - plot.Weeds, 0, 100)
```

#### PLANT
Plants a crop. Allowed on empty plots or plots with a dead crop:
```
plot.Crop      = crop
plot.Hydration = 100
plot.Weeds     = 0
plot.Health    = 100
plot.Growth    = 0
plot.Occupied  = true
```

#### HARVEST
Harvests a fully grown, living crop (`Growth == 100`, `Health > 0`). Adds `crop.HarvestScore` to `garden.Score` and clears the plot.

#### REMOVE
Removes a dead crop (`Health == 0`) from an occupied plot. Resets the plot to neutral state (`Hydration = 50`, `Health = 50`).

---

## ⚔️ Conflict Resolution

### Strategy: Server-Authoritative + First-Write Wins

All actions are validated on the server:

```
if plot.Occupied {
    reject
}
```

---

### Versioning (Optional)

Prevents stale updates:

```
if event.Version != plot.Version {
    reject
}
```

On success:

```
plot.Version++
```

---

### Error Response

```
{
  "type": "ERROR",
  "message": "plot_taken"
}
```

---

## 📡 WebSocket Protocol

### Client → Server

```
{
  "type": "WATER",
  "plotId": "A1",
  "version": 2
}
```

---

### Server → Client

#### State Update

```
{
  "type": "STATE",
  "garden": { ... }
}
```

#### Error

```
{
  "type": "ERROR",
  "message": "version_conflict"
}
```

---

## ⚛️ Frontend Responsibilities

* Maintain WebSocket connection
* Render garden grid
* Send actions
* Handle updates + errors

---

## 🎨 UI Behavior

Each plot:

* Color-coded by health:

  * 🟢 Healthy
  * 🟡 Warning
  * 🔴 Critical

* Interactions:

  * Click → water
  * Right-click → weed

---

## 🚀 Getting Started

### 1. Run Backend

```
cd backend
go mod tidy
go run cmd/server/main.go
```

Server runs on:

```
http://localhost:8080
```

---

### 2. Run Frontend

```
cd frontend
npm install
npm run dev
```

Open:

```
http://localhost:5173
```

---

## 🔥 Development Roadmap

### Phase 1 (MVP)

* WebSocket connection
* Garden engine loop
* Real-time updates

### Phase 2

* Plot grid system
* Action handling
* Conflict resolution

### Phase 3

* Versioning
* Error handling
* UI polish

### Phase 4

* Persistence (Postgres)
* Scaling (Redis/pub-sub)
* Authentication

---

## ⚠️ Limitations (Current)

* In-memory only (no persistence)
* Single server instance
* No authentication
* No horizontal scaling

---

## 🔮 Future Improvements

* Snapshot state to database
* Multi-server architecture
* User accounts + leaderboards
* Seasonal resets / events

---

## 🧠 Key Concepts Learned

* Event-driven architecture
* Actor model in Go
* Real-time systems with WebSockets
* Conflict resolution strategies
* Server-authoritative design

---

## 💡 Final Thought

This project is more than a game:

> It’s a **real-time distributed coordination system disguised as a garden.**

---
