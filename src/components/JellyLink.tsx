import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

// 果凍彈跳按鈕：滑過或點擊時像果凍一樣壓扁、拉長、再晃回原狀。
// 重播的做法：先移除 class、強制 reflow，再加回去，動畫才會重新開始。
export function JellyLink({ to, children, small }: { to: string; children: ReactNode; small?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null)

  const play = () => {
    const el = ref.current
    if (!el) return
    el.classList.remove('jelly-play')
    void el.offsetWidth
    el.classList.add('jelly-play')
  }

  return (
    <Link
      ref={ref}
      to={to}
      className={`btn-accent jelly${small ? ' btn-sm' : ''}`}
      onMouseEnter={play}
      onClick={play}
      onAnimationEnd={() => ref.current?.classList.remove('jelly-play')}
    >
      {children}
    </Link>
  )
}
