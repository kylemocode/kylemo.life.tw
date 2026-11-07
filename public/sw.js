// 簡單的離線快取：
// - 頁面（導覽請求）：先連網路，失敗時用快取的 index.html（所以離線也能開 SPA）
// - 靜態檔（js/css/圖片/字型）：先用快取，背景更新（stale-while-revalidate）
// 改版時把 VERSION 加一，舊快取就會被清掉。
const VERSION = 'v1'
const CACHE = `kylemo-${VERSION}`
const PRECACHE = ['/', '/manifest.webmanifest', '/pwa-192.png', '/pwa-512.png', '/favicon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const sameOrigin = url.origin === self.location.origin
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/').then((r) => r || Response.error())),
    )
    return
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req)
      const net = fetch(req)
        .then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone())
          return res
        })
        .catch(() => hit)
      return hit || net
    }),
  )
})
