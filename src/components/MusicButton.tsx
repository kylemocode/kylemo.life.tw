import { useEffect, useState } from 'react'
import { track } from '../analytics'
import { music } from '../audio/chiptune'
import { useLang } from '../i18n'

// 背景音樂開關：瀏覽器不允許自動播放有聲音的內容，所以預設關閉，點了才開始
export function MusicButton() {
  const { t } = useLang()
  const [on, setOn] = useState(false)

  useEffect(() => {
    const onVis = () => (document.hidden ? music.pause() : music.resume())
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  function toggle() {
    if (on) music.stop()
    else music.start()
    setOn(!on)
    track('music_toggle', { on: !on })
  }

  const label = t(on ? 'music.off' : 'music.on')
  return (
    <button type="button" className="icon-button music-button" aria-label={label} aria-pressed={on} title={label} onClick={toggle}>
      <svg viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
        {/* 像素喇叭 */}
        <path d="M1 5h3v6H1z M4 4h1v8H4z M5 3h1v10H5z M6 2h1v12H6z" />
        {on ? (
          <path d="M9 6h1v4H9z M11 4h1v8h-1z M13 2h1v12h-1z" />
        ) : (
          <path d="M9 6h1v1H9z M10 7h1v1h-1z M11 8h1v1h-1z M12 9h1v1h-1z M13 10h1v1h-1z M13 6h1v1h-1z M12 7h1v1h-1z M10 9h1v1h-1z M9 10h1v1H9z" />
        )}
      </svg>
    </button>
  )
}
