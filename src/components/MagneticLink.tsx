import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

// 磁吸按鈕：游標靠近時按鈕被吸向游標，文字移動得比按鈕少（形成層次）；
// 離開時用彈簧帶彈性回到原位。不用動畫套件，自己算一個簡單的彈簧。
const RANGE = 90 // 離按鈕邊緣多近開始被吸（px）
const PULL = 0.35 // 按鈕跟著游標移動的比例
const MAX = 20 // 最多位移（px）
const TEXT_SHIFT = 0.5 // 文字相對按鈕反向補償，所以文字實際只移動一半

export function MagneticLink({ to, children, small }: { to: string; children: ReactNode; small?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    const text = textRef.current
    if (!el || !text) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return

    const pos = { x: 0, y: 0 }
    const vel = { x: 0, y: 0 }
    const tgt = { x: 0, y: 0 }
    let engaged = false
    let raf = 0
    let last = 0

    const render = () => {
      el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      text.style.transform = `translate(${-pos.x * TEXT_SHIFT}px, ${-pos.y * TEXT_SHIFT}px)`
    }

    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000 || 0.016)
      last = now
      // 被吸住時阻尼大一點（跟手）；放開時阻尼小，才會彈
      const k = 220
      const c = engaged ? 24 : 9
      for (const a of ['x', 'y'] as const) {
        const acc = -k * (pos[a] - tgt[a]) - c * vel[a]
        vel[a] += acc * dt
        pos[a] += vel[a] * dt
      }
      render()
      const settled =
        !engaged && Math.abs(pos.x) < 0.05 && Math.abs(pos.y) < 0.05 && Math.abs(vel.x) < 0.05 && Math.abs(vel.y) < 0.05
      if (settled) {
        pos.x = pos.y = vel.x = vel.y = 0
        render()
        raf = 0
        return
      }
      raf = requestAnimationFrame(step)
    }
    const run = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(step)
      }
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      // 先把目前位移扣掉，才是按鈕「原本」的位置，不然會越吸越遠
      const cx = r.left - pos.x + r.width / 2
      const cy = r.top - pos.y + r.height / 2
      const dx = Math.max(Math.abs(e.clientX - cx) - r.width / 2, 0)
      const dy = Math.max(Math.abs(e.clientY - cy) - r.height / 2, 0)
      const near = Math.hypot(dx, dy) < RANGE
      if (near) {
        tgt.x = Math.max(-MAX, Math.min(MAX, (e.clientX - cx) * PULL))
        tgt.y = Math.max(-MAX, Math.min(MAX, (e.clientY - cy) * PULL))
      } else {
        tgt.x = tgt.y = 0
      }
      if (near !== engaged) {
        engaged = near
        el.classList.toggle('magnet-on', near)
      }
      run()
    }
    const onLeaveWindow = () => {
      tgt.x = tgt.y = 0
      engaged = false
      el.classList.remove('magnet-on')
      run()
    }

    window.addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('pointerleave', onLeaveWindow)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <Link ref={ref} to={to} className={`btn-accent magnetic${small ? ' btn-sm' : ''}`}>
      <span ref={textRef} className="magnetic-text">
        {children}
      </span>
    </Link>
  )
}
