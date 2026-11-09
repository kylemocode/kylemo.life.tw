// 把一組字串畫成像素 SVG（# 是有色的格子），顏色跟著文字色（currentColor）
export function PixelIcon({ rows, size = 4, className }: { rows: string[]; size?: number; className?: string }) {
  const w = Math.max(...rows.map((r) => r.length))
  const d: string[] = []
  rows.forEach((row, y) => [...row].forEach((c, x) => c === '#' && d.push(`M${x} ${y}h1v1h-1z`)))
  return (
    <svg className={className} viewBox={`0 0 ${w} ${rows.length}`} width={w * size} height={rows.length * size} shapeRendering="crispEdges" aria-hidden="true">
      <path d={d.join('')} fill="currentColor" />
    </svg>
  )
}
