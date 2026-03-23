import { useState } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import type { Garden as GardenType } from '../hooks/useSocket'
import Plot from './Plot'
import { STAT_SPRITES, CROP_SPRITES } from './cropSprites'
import type { SpriteData } from './cropSprites'

type Action = 'WATER' | 'WEED' | 'PLANT' | 'HARVEST'
type CropType = 'CORN' | 'WHEAT' | 'COTTON' | 'STRAWBERRY'

const ACTIONS: { type: Action; spriteKey: string; label: string }[] = [
  { type: 'WATER',   spriteKey: 'hydration', label: 'Water'   },
  { type: 'WEED',    spriteKey: 'weeds',     label: 'Weed'    },
  { type: 'PLANT',   spriteKey: 'growth',    label: 'Plant'   },
  { type: 'HARVEST', spriteKey: 'harvest',   label: 'Harvest' },
]

const CROPS: { type: CropType; label: string }[] = [
  { type: 'CORN',       label: 'Corn'       },
  { type: 'WHEAT',      label: 'Wheat'      },
  { type: 'COTTON',     label: 'Cotton'     },
  { type: 'STRAWBERRY', label: 'Strawberry' },
]

const PLOT_IDS = ['A','B','C','D','E'].flatMap(row =>
  [1,2,3,4,5].map(col => `${row}${col}`)
)

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

interface GardenProps {
  garden: GardenType
  onAction: (plotId: string, type: string, version: number, crop?: string) => void
}

export default function Garden({ garden, onAction }: GardenProps) {
  const [selectedAction, setSelectedAction] = useState<Action>('WATER')
  const [selectedCrop, setSelectedCrop] = useState<CropType>('CORN')

  const handlePlotAction = (plotId: string, type: string, version: number) => {
    onAction(plotId, type, version, type === 'PLANT' ? selectedCrop : undefined)
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Sidebar for actions and crops */}
      <aside className="w-full md:w-64 flex flex-col gap-6 p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">Tools</h2>
          <div className="flex flex-col gap-2">
            {ACTIONS.map(({ type, spriteKey, label }) => (
              <button
                key={type}
                onClick={() => setSelectedAction(type)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200
                  ${selectedAction === type
                    ? 'bg-blue-600/20 border-2 border-blue-500 text-blue-100 shadow-inner'
                    : 'bg-gray-700 border-2 border-transparent text-gray-300 hover:bg-gray-600 hover:border-gray-500'}
                `}
              >
                <div className="p-1 bg-gray-900/50 rounded flex items-center justify-center shrink-0 w-8 h-8">
                  <SpriteIcon pixels={STAT_SPRITES[spriteKey] ?? []} scale={3} size={24} />
                </div>
                <span className="font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Crop picker — only visible when PLANT is selected */}
        {selectedAction === 'PLANT' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">Seeds</h2>
            <div className="flex flex-col gap-2">
              {CROPS.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => setSelectedCrop(type)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200
                    ${selectedCrop === type
                      ? 'bg-emerald-600/20 border-2 border-emerald-500 text-emerald-100 shadow-inner'
                      : 'bg-gray-700 border-2 border-transparent text-gray-300 hover:bg-gray-600 hover:border-gray-500'}
                  `}
                >
                  <div className="p-1 bg-gray-900/50 rounded flex items-center justify-center shrink-0 w-10 h-10">
                    <SpriteIcon pixels={CROP_SPRITES[type]?.seedling ?? []} scale={2} size={32} />
                  </div>
                  <span className="font-semibold text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Grid Area */}
      <section className="flex-1 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg w-full overflow-x-auto">
        <div className="grid grid-cols-5 gap-4 min-w-[600px] mx-auto">
          {PLOT_IDS.map(id => {
            const plot = garden.plots[id]
            if (!plot) return null
            return (
              <Plot
                key={id}
                plot={plot}
                selectedAction={selectedAction}
                onAction={handlePlotAction}
              />
            )
          })}
        </div>
      </section>
    </div>
  )
}
