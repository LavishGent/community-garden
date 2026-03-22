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
     ├── Event Queue
     └── Broadcast Loop
```

---

## ⚙️ Tech Stack

### Backend

* Go
* WebSockets (`gorilla/websocket`)
* In-memory state (no database)

### Frontend

* React (Vite)
* WebSocket client

---

## 🧱 Project Structure

```
community-garden/
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── engine/
│   │   │   ├── engine.go
│   │   │   ├── models.go
│   │   │   └── logic.go
│   │   └── ws/
│   │       ├── handler.go
│   │       ├── client.go
│   │       └── hub.go
│   └── go.mod
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── hooks/useSocket.js
│   │   └── components/
│   │       ├── Garden.jsx
│   │       └── Plot.jsx
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🌿 Domain Model

### Garden

```
type Garden struct {
    Plots map[string]*Plot
}
```

---

### Plot

```
type Plot struct {
    ID        string
    Hydration float64
    Weeds     float64
    Occupied  bool
    Health    float64
    Version   int
}
```

---

### Event

```
type Event struct {
    Type    string
    PlotID  string
    Version int
    Client  *Client
}
```

---

## 🔁 Simulation Engine

### Core Concept

The entire system runs inside a **single goroutine**:

* No locks
* No race conditions
* Deterministic updates

---

### Event Loop

```
func (e *GardenEngine) Run() {
    ticker := time.NewTicker(1 * time.Second)

    for {
        select {
        case event := <-e.events:
            e.handleEvent(event)

        case <-ticker.C:
            e.applyDecay()
            e.broadcast()
        }
    }
}
```

---

## ⏱️ Simulation Rules

### Decay (every tick)

* Hydration decreases
* Weeds increase
* Health recalculated

```
plot.Hydration -= 0.2
plot.Weeds += 0.1
plot.Health = plot.Hydration - plot.Weeds
```

---

### Actions

#### WATER

```
plot.Hydration += 5
```

#### WEED

```
plot.Weeds -= 3
```

#### PLANT

```
if !plot.Occupied {
    plot.Occupied = true
}
```

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
