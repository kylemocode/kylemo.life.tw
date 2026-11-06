// 像素吃豆人：在一排小點上從左跑到右，一路把點吃掉。純裝飾，螢幕閱讀器會略過。

const OPEN = [
  '...#####...',
  '.#########.',
  '######E####',
  '#########..',
  '#######....',
  '#####......',
  '#######....',
  '#########..',
  '###########',
  '.#########.',
  '...#####...',
]
const CLOSED = OPEN.map((row, y) => (y >= 3 && y <= 7 ? '###########' : row))

function Sprite({ rows, className }: { rows: string[]; className: string }) {
  const body: string[] = []
  const eye: string[] = []
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === '#') body.push(`M${x} ${y}h1v1h-1z`)
      if (c === 'E') eye.push(`M${x} ${y}h1v1h-1z`)
    }),
  )
  return (
    <svg className={className} viewBox="0 0 11 11" shapeRendering="crispEdges" aria-hidden="true">
      <path d={body.join('')} fill="#f2c230" />
      <path d={eye.join('')} fill="#1d1c1a" />
    </svg>
  )
}

export function Chomper() {
  return (
    <div className="chomper" aria-hidden="true">
      <div className="chomper-dots" />
      <div className="chomper-mask" />
      <div className="chomper-pac">
        <Sprite rows={OPEN} className="pac-open" />
        <Sprite rows={CLOSED} className="pac-closed" />
      </div>
    </div>
  )
}
