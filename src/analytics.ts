import posthog from 'posthog-js'

// PostHog 網站分析。key 從環境變數 VITE_POSTHOG_KEY 讀（本機 .env.local、上線在 Vercel 設定）。
// 沒設定、或在本機（localhost）開發時完全不送資料。
const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
const enabled = Boolean(key) && !isLocal

export function initAnalytics() {
  if (!enabled) return
  posthog.init(key!, {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: 'history_change', // 單頁應用：換頁也要算一次瀏覽
    persistence: 'localStorage', // 不使用 cookie，就不需要 cookie 提示
    person_profiles: 'identified_only', // 匿名訪客不建立個人檔案，省額度也比較不侵犯隱私
  })
}

// 自訂事件，例如 track('game_start')
export function track(event: string, props?: Record<string, unknown>) {
  if (enabled) posthog.capture(event, props)
}
