import { useRef } from 'react'
import { site } from '../data/site'
import { Icon } from './Icons'
import { Tetris } from './Tetris'

// Dock 放大：游標靠近時，最近的圖示放大到 1.9 倍，鄰近的依距離遞減
const SIZE = 30 // 和 CSS 的圖示基本尺寸、間距、左右 padding 對應
const GAP = 8
const PAD_X = 16
const RANGE = 84
const PEAK = 0.9

export function Footer() {
  const year = new Date().getFullYear()
  const listRef = useRef<HTMLUListElement>(null)

  function setScales(scales: number[]) {
    listRef.current?.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--s', String(scales[i] ?? 1)))
  }
  function onMove(e: React.PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ul = listRef.current!
    const left = ul.getBoundingClientRect().left + PAD_X // ul 寬度固定，所以用「沒放大時」的位置算距離，才不會抖動
    setScales(
      site.socials.map((_, i) => {
        const center = left + i * (SIZE + GAP) + SIZE / 2
        return 1 + PEAK * Math.max(0, 1 - Math.abs(e.clientX - center) / RANGE)
      }),
    )
  }
  const reset = () => setScales([])

  return (
    <footer className="site-footer">
      <div className="container footer-tetris">
        <Tetris rows={3} mode="loop" />
      </div>
      <div className="container inner">
        <p className="muted">
          © {year} {site.handle}
        </p>
        <ul ref={listRef} className="dock" style={{ '--n': site.socials.length } as React.CSSProperties} onPointerMove={onMove} onPointerLeave={reset}>
          {site.socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} aria-label={s.label} title={s.label} {...(s.href.startsWith('http') ? { target: '_blank', rel: 'me noopener' } : {})}>
                <Icon name={s.icon} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
