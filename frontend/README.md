# 🌱 Community Garden — Frontend

React 19 + TypeScript client for the Community Garden real-time multiplayer simulation.

## Tech Stack

* **React 19** + **TypeScript** (Vite)
* **Tailwind CSS** for layout and UI
* **React-Konva** for canvas-based garden rendering with pixel-art crop sprites

## Structure

```
src/
├── App.tsx                    # Root component — WebSocket wiring, error banner, layout
├── hooks/
│   └── useSocket.ts           # WebSocket hook: connects, parses STATE/ERROR messages
└── components/
    ├── Garden.tsx             # Renders the 5×5 grid of plots on a Konva canvas
    ├── Plot.tsx               # Single plot: sprite, health/hydration/weed bars, action buttons
    └── cropSprites.ts         # Pixel-art sprite data (16×16) for all crops & growth stages
```

## WebSocket Protocol

Messages sent to the server:

```json
{ "type": "WATER",   "plotId": "A1", "version": 3 }
{ "type": "WEED",    "plotId": "B2", "version": 7 }
{ "type": "PLANT",   "plotId": "C3", "version": 0, "crop": "CORN" }
{ "type": "HARVEST", "plotId": "D4", "version": 12 }
{ "type": "REMOVE",  "plotId": "E5", "version": 5 }
```

Messages received from the server:

```json
{ "type": "STATE",  "garden": { "plots": { ... }, "score": 42 } }
{ "type": "ERROR",  "message": "plot_occupied" }
```

## Environment

| Variable      | Default                    | Description              |
|---------------|----------------------------|--------------------------|
| `VITE_WS_URL` | `ws://localhost:8080/ws`   | WebSocket server address |

## Running Locally

```bash
npm install
npm run dev
```
