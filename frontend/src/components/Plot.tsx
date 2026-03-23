import { Stage, Layer, Rect, Text, Group } from 'react-konva'
import type { Plot as PlotType } from "../hooks/useSocket";
import { CROP_SPRITES, STAT_SPRITES, getCropStage } from './cropSprites'

type Action = 'WATER' | 'WEED' | 'PLANT' | 'HARVEST'

interface PlotProps {
   plot: PlotType,
   selectedAction: Action
   onAction: (plotId: string, type: string, version: number) => void
}

function getHealthStyles(health: number): string {
   if (health > 66) return "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
   if (health > 33) return "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
   return "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
}

const CROP_SCALE = 4   // 16×16 sprite → 64×64px
const STAT_SCALE = 3   // 8×8 sprite  → 24×24px
const STAT_SPRITE_W = 8 * STAT_SCALE  // 24px
const STAT_COL_W = STAT_SPRITE_W + 30 // sprite + number text
const STATS_W = STAT_COL_W * 2        // 2 columns
const STATS_H = (STAT_SPRITE_W + 4) * 2 // 2 rows

// Renders the 16×16 crop pixel art + weed sprites overlaid
function PixelPlant({ crop, growth, weeds }: { crop: string; growth: number; weeds: number }) {
  const stage = getCropStage(growth)
  const sprites = CROP_SPRITES[crop] ?? CROP_SPRITES['CORN']
  const pixels = sprites[stage]

  const WEED_ANCHORS = [
    { x: 1,  y: 13 },
    { x: 12, y: 13 },
    { x: 1,  y: 10 },
    { x: 12, y: 10 },
  ]
  const WEED_SPRITE: [number, number][] = [
    [0, 0], [0, 1], [0, 2],
    [-1, 0], [1, 0],
  ]
  const weedCount = Math.floor((weeds / 100) * WEED_ANCHORS.length)

  return (
    <Stage width={16 * CROP_SCALE} height={16 * CROP_SCALE} style={{ display: 'block', margin: 'auto' }}>
      <Layer>
        {pixels.map(([x, y, color], i) => (
          <Rect key={i} x={x * CROP_SCALE} y={y * CROP_SCALE} width={CROP_SCALE} height={CROP_SCALE} fill={color} />
        ))}
        {WEED_ANCHORS.slice(0, weedCount).map((anchor, i) =>
          WEED_SPRITE.map(([dx, dy], j) => (
            <Rect
              key={`w-${i}-${j}`}
              x={(anchor.x + dx) * CROP_SCALE}
              y={(anchor.y + dy) * CROP_SCALE}
              width={CROP_SCALE}
              height={CROP_SCALE}
              fill="#a16207"
            />
          ))
        )}
      </Layer>
    </Stage>
  )
}

// 4-stat bar: growth, hydration, health, weeds — laid out as 2×2 grid
function StatBar({ plot }: { plot: PlotType }) {
  const stats: { key: string; value: number }[] = [
    { key: 'growth',    value: plot.growth    },
    { key: 'hydration', value: plot.hydration },
    { key: 'health',    value: plot.health    },
    { key: 'weeds',     value: plot.weeds     },
  ]
  return (
    <Stage width={STATS_W} height={STATS_H} style={{ display: 'block', margin: 'auto' }}>
      <Layer>
        {stats.map(({ key, value }, i) => {
          const col = i % 2
          const row = Math.floor(i / 2)
          const offsetX = col * STAT_COL_W
          const offsetY = row * (STAT_SPRITE_W + 4)
          const pixels = STAT_SPRITES[key] ?? []
          return (
            <Group key={key} x={offsetX} y={offsetY}>
              {pixels.map(([x, y, color], pi) => (
                <Rect
                  key={pi}
                  x={x * STAT_SCALE}
                  y={y * STAT_SCALE}
                  width={STAT_SCALE}
                  height={STAT_SCALE}
                  fill={color}
                />
              ))}
              <Text
                x={STAT_SPRITE_W + 3}
                y={4}
                text={String(Math.round(value))}
                fontSize={12}
                fontFamily="monospace"
                fill="#f3f4f6" // text-gray-100
                fontStyle="bold"
              />
            </Group>
          )
        })}
      </Layer>
    </Stage>
  )
}

export default function Plot({ plot, selectedAction, onAction }: PlotProps) {
   const isDisabled =
     (selectedAction === 'PLANT'   && plot.occupied) ||
     (selectedAction === 'HARVEST' && !plot.occupied)

   const handleClick = () => {
      if (isDisabled) return;
      onAction(plot.id, selectedAction, plot.version);
   }

   const baseClasses = "relative rounded-xl transition-all duration-200 min-h-[140px] flex flex-col overflow-hidden"

   if (!plot.occupied) {
      return (
      <div
        onClick={handleClick}
        className={`${baseClasses} bg-amber-900/40 border-2 border-amber-900/60 hover:bg-amber-900/60
          ${selectedAction === 'PLANT' ? 'cursor-pointer hover:border-emerald-500' : 'cursor-default'}
        `}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjNzg1MzNhIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM4YjVkMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-30 mix-blend-overlay pointer-events-none"></div>
        <div className="p-2 z-10">
          <span className="font-bold text-xs text-amber-200/50 bg-amber-950/50 px-2 py-1 rounded">{plot.id}</span>
        </div>
      </div>
    )
   }

   return (
    <div
      onClick={handleClick}
      className={`${baseClasses} bg-amber-950/80 border-2 ${getHealthStyles(plot.health)}
        ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:brightness-110 active:scale-95'}
      `}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjNzg1MzNhIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM4YjVkMzMiPjwvcmVjdD4KPC9zdmc+')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      <div className="p-2 flex-1 flex flex-col items-center justify-between z-10 w-full gap-2">
        <div className="w-full flex justify-start">
          <span className="font-bold text-xs text-gray-300 bg-gray-900/60 px-2 py-1 rounded shadow-sm">{plot.id}</span>
        </div>

        <div className="flex-1 flex items-center justify-center filter drop-shadow-md">
          <PixelPlant crop={plot.crop} growth={plot.growth} weeds={plot.weeds} />
        </div>

        <div className="bg-gray-900/80 p-2 rounded-lg w-full border border-gray-700/50 shadow-inner">
          <StatBar plot={plot} />
        </div>
      </div>
    </div>
  )
}
