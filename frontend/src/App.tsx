import { useState } from 'react'
import { useSocket } from './hooks/useSocket'
import Garden from './components/Garden'
import HelpModal from './components/HelpModal'

const HELP_SEEN_KEY = 'cg_help_seen'

export default function App() {
  const wsUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'
  const { garden, connected, errorMsg, send } = useSocket(wsUrl)
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem(HELP_SEEN_KEY))

  const closeHelp = () => {
    localStorage.setItem(HELP_SEEN_KEY, '1')
    setShowHelp(false)
  }

  const handleAction = (plotId: string, type: string, version: number, crop?: string) => {
    send({ type, plotId, version, ...(crop ? { crop } : {}) })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      {showHelp && <HelpModal onClose={closeHelp} />}

      <div className="max-w-6xl mx-auto">
        {errorMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-600 text-red-200 font-semibold px-5 py-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            {errorMsg}
          </div>
        )}

        <header className="mb-8 flex items-center justify-between border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-emerald-400">🌱 Community Garden</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHelp(true)}
              className="w-7 h-7 rounded-full bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white text-sm font-bold transition-colors flex items-center justify-center"
              aria-label="Help"
            >
              ?
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-400">Server Status:</span>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${connected ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {connected ? 'Connected' : 'Disconnected'}
              </div>
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
