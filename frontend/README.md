# 🌱 Community Garden — Frontend

React 19 + TypeScript client for the Community Garden real-time multiplayer simulation.

---

## Tech Stack

- **React 19** + **TypeScript** via [Vite](https://vitejs.dev/)
- **Tailwind CSS** — utility-first styling and layout
- **React-Konva** — canvas-based garden rendering with pixel-art crop sprites

---

## Project Structure

```
src/
├── App.tsx                    # Root component — WebSocket wiring, error banner, layout
├── hooks/
│   └── useSocket.ts           # WebSocket hook: connect, parse STATE / ERROR messages, reconnect
└── components/
    ├── Garden.tsx             # 5×5 Konva canvas grid — renders all plots
    ├── Plot.tsx               # Single plot: sprite, health / hydration / weed bars, action buttons
    └── cropSprites.ts         # 16×16 pixel-art sprite data for all crops and growth stages
```

---

## WebSocket Protocol

**Sent to server:**

```json
{ "type": "WATER",   "plotId": "A1", "version": 3 }
{ "type": "WEED",    "plotId": "B2", "version": 7 }
{ "type": "PLANT",   "plotId": "C3", "version": 0, "crop": "CORN" }
{ "type": "HARVEST", "plotId": "D4", "version": 12 }
{ "type": "REMOVE",  "plotId": "E5", "version": 5 }
```

**Received from server:**

```json
{ "type": "STATE", "garden": { "plots": { "A1": { ... } }, "score": 42 } }
{ "type": "ERROR", "message": "version_conflict" }
```

The `version` field on outbound messages implements **optimistic concurrency** — the server rejects actions that were based on stale state.

---

## Environment

| Variable      | Default                    | Description                        |
|---------------|----------------------------|------------------------------------|
| `VITE_WS_URL` | `ws://localhost:8080/ws`   | WebSocket server address to connect to |

Set in a `.env.local` file for local overrides:

```bash
VITE_WS_URL=ws://my-server.fly.dev/ws
```

---

## Running Locally

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

**Other commands:**

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint
```

