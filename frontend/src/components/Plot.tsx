import { Stage, Layer, Rect } from 'react-konva'
import type { Plot } from "../hooks/useSocket";

interface PlotProps {
   plot: Plot,
   selectedAction: 'WATER' | 'WEED' | 'PLANT'
   onAction: (plotId: string, type: string, version: number) => void
}

function getColor(health: number): string {
   const green = "#4CAF50";
   const yellow = "#FFEB3B";
   const red = "#F44336";
   if (health > 66) return green;
   if (health > 33) return yellow;
   return red;
}

const SCALE = 4 // each pixel = 4px

// Plant pixels on a 16x16 grid [x, y, color]
const PLANT_PIXELS: [number, number, string][] = [
  [7, 15, '#166534'], [7, 14, '#166534'], [7, 13, '#166534'], // stem
  [7, 12, '#15803d'], [7, 11, '#15803d'],                     // upper stem
  [5, 10, '#16a34a'], [6, 10, '#16a34a'], [7, 10, '#16a34a'], // left branch
  [7,  9, '#16a34a'], [8,  9, '#16a34a'], [9,  9, '#16a34a'], // right branch
  [7,  8, '#15803d'], [7,  7, '#15803d'],                     // top stem
  [6,  6, '#22c55e'], [7,  6, '#22c55e'], [8,  6, '#22c55e'], // canopy
  [7,  5, '#22c55e'],                                          // top leaf
]

const WEED_ANCHORS = [
  { x: 1,  y: 13 },
  { x: 12, y: 13 },
  { x: 1,  y: 10 },
  { x: 12, y: 10 },
]

// Y-shaped weed sprite, relative coords
const WEED_SPRITE: [number, number][] = [
  [0, 0], [0, 1], [0, 2],   // stem
  [-1, 0], [1, 0],           // fork
]

function PixelPlant({ weeds }: { weeds: number }) {
  const weedCount = Math.floor((weeds / 100) * WEED_ANCHORS.length)

  return (
    <Stage width={16 * SCALE} height={16 * SCALE} style={{ display: 'block', margin: 'auto' }}>
      <Layer>
        {/* plant */}
        {PLANT_PIXELS.map(([x, y, color], i) => (
          <Rect key={i} x={x * SCALE} y={y * SCALE} width={SCALE} height={SCALE} fill={color} />
        ))}

        {/* weeds */}
        {WEED_ANCHORS.slice(0, weedCount).map((anchor, i) =>
          WEED_SPRITE.map(([dx, dy], j) => (
            <Rect
              key={`w-${i}-${j}`}
              x={(anchor.x + dx) * SCALE}
              y={(anchor.y + dy) * SCALE}
              width={SCALE}
              height={SCALE}
              fill="#a16207"
            />
          ))
        )}
      </Layer>
    </Stage>
  )
}

export default function Plot({ plot, selectedAction, onAction }: PlotProps) { 
   const isDisabled = selectedAction === 'PLANT' && plot.occupied;

   const handleClick = () => {
      if (isDisabled) return;
      onAction(plot.id, selectedAction, plot.version);
   }

   if (!plot.occupied) {
      return (
      <div
        onClick={handleClick}
        style={{
          backgroundColor: '#92400e',
          padding: '8px',
          borderRadius: '6px',
          cursor: selectedAction === 'PLANT' ? 'pointer' : 'default',
          minHeight: '80px',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#fef3c7' }}>{plot.id}</span>
      </div>
    )
   }

   return (
    <div
      onClick={handleClick}
      style={{
        backgroundColor: getColor(plot.health),
        padding: '8px',
        borderRadius: '6px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        userSelect: 'none',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{plot.id}</span>
      <span style={{ fontSize: '11px' }}>{Math.round(plot.health)}</span>
      {plot.occupied && <PixelPlant weeds={plot.weeds} />}
    </div>
  )
}