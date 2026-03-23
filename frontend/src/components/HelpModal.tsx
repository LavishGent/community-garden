import { Stage, Layer, Rect } from 'react-konva'
import { STAT_SPRITES, CROP_SPRITES } from './cropSprites'
import type { SpriteData } from './cropSprites'

interface HelpModalProps {
  onClose: () => void
}

function SpriteIcon({ pixels, scale, size }: { pixels: SpriteData; scale: number; size: number }) {
  return (
    <Stage width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <Layer>
        {pixels.map(([x, y, color], i) => (
          <Rect key={i} x={x * scale} y={y * scale} width={scale} height={scale} fill={color} />
        ))}
      </Layer>
    </Stage>
  )
}

const ACTIONS: { spriteKey: string; label: string; desc: string }[] = [
  { spriteKey: 'growth',    label: 'Plant',   desc: 'Select a crop and click an empty plot to plant it.' },
  { spriteKey: 'hydration', label: 'Water',   desc: 'Keeps hydration up — crops die if they dry out.' },
  { spriteKey: 'weeds',     label: 'Weed',    desc: 'Removes weeds that drag down crop health.' },
  { spriteKey: 'harvest',   label: 'Harvest', desc: 'Collect fully grown (100%) living crops for points.' },
  { spriteKey: 'health',    label: 'Remove',  desc: 'Clear a dead crop so the plot can be replanted.' },
]

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-emerald-400">Welcome to Community Garden</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">
          A real-time multiplayer garden that <span className="text-red-400 font-semibold">decays over time</span>.
          Work together with other players to keep it alive and rack up the harvest score.
        </p>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">How to play</h3>
          <div className="flex flex-col gap-2">
            {ACTIONS.map(({ spriteKey, label, desc }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-gray-200">
                <div className="p-1 bg-gray-900/50 rounded flex items-center justify-center shrink-0 w-8 h-8">
                  <SpriteIcon pixels={STAT_SPRITES[spriteKey] ?? []} scale={3} size={24} />
                </div>
                <span>
                  <span className="font-semibold text-gray-100">{label}:</span> {desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700 text-xs text-gray-400 leading-relaxed">
          <span className="text-yellow-400 font-semibold">Tip:</span> Every second, crops get thirstier and weeds
          grow. Faster-growing crops like{' '}
          <span className="inline-flex items-center gap-1 align-middle">
            <SpriteIcon pixels={CROP_SPRITES['STRAWBERRY'].mature} scale={1} size={16} />
            <span className="text-pink-400">Strawberry</span>
          </span>{' '}
          score more but need constant attention. Slower crops like{' '}
          <span className="inline-flex items-center gap-1 align-middle">
            <SpriteIcon pixels={CROP_SPRITES['WHEAT'].mature} scale={1} size={16} />
            <span className="text-yellow-300">Wheat</span>
          </span>{' '}
          are more forgiving.
        </div>

        <button
          onClick={onClose}
          className="mt-1 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold transition-colors"
        >
          Start Gardening
        </button>
      </div>
    </div>
  )
}
