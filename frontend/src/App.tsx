import { useSocket } from './hooks/useSocket'
import Garden from './components/Garden'

export default function App() {
  const { garden, connected, send } = useSocket('ws://localhost:8080/ws')

  const handleAction = (plotId: string, type: string, version: number, crop?: string) => {
    send({ type, plotId, version, ...(crop ? { crop } : {}) })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center justify-between border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-emerald-400">🌱 Community Garden</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">Server Status:</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${connected ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </header>

        <main>
          {garden ? (
            <Garden garden={garden} onAction={handleAction} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p>Waiting for garden state...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
