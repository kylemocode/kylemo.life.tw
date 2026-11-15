import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import type { IncomingMessage } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const ORIGIN = 'https://kylemo.me'

// 建置時自動產生 sitemap.xml：固定頁面 + content/posts 裡每一篇文章（用檔名當網址，date 當更新日期）
function sitemap(): Plugin {
  return {
    name: 'sitemap',
    generateBundle() {
      const urls: { loc: string; lastmod?: string }[] = [{ loc: '/' }, { loc: '/about' }, { loc: '/blog' }]
      try {
        for (const f of readdirSync('content/posts')) {
          if (!f.endsWith('.md') || f.endsWith('.en.md')) continue
          const text = readFileSync(`content/posts/${f}`, 'utf8')
          const date = text.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m)?.[1]
          urls.push({ loc: `/blog/${f.replace(/\.md$/, '')}`, lastmod: date })
        }
      } catch {
        // 還沒有文章資料夾也沒關係
      }
      const body = urls
        .map((u) => `  <url><loc>${ORIGIN}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
        .join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
      })
    },
  }
}

// 本機寫作用的小 API（只在 npm run dev 時存在，build 與上線都沒有）：
//   GET  /__drafts          讀取 content/drafts/ 全部草稿
//   PUT  /__drafts/:slug    存草稿
//   POST /__publish/:slug   把草稿移到 content/posts/（發布）
//   POST /__image?name=     存圖片到 public/images/
function draftApi(): Plugin {
  const readBody = (req: IncomingMessage) =>
    new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })
  return {
    name: 'draft-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local')
        if (!url.pathname.startsWith('/__drafts') && !url.pathname.startsWith('/__publish') && !url.pathname.startsWith('/__posts') && url.pathname !== '/__image') return next()
        const fail = (code: number, msg: string) => {
          res.statusCode = code
          res.end(msg)
        }
        // 只接受本機請求（避免用 --host 開給區網時被別人寫檔）
        const addr = req.socket.remoteAddress ?? ''
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(addr)) return fail(403, 'local only')
        try {
          if (url.pathname === '/__drafts' && req.method === 'GET') {
            const out: Record<string, string> = {}
            if (existsSync('content/drafts')) {
              for (const f of readdirSync('content/drafts')) {
                if (f.endsWith('.md')) out[`/content/drafts/${f}`] = readFileSync(`content/drafts/${f}`, 'utf8')
              }
            }
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify(out))
          }
          if (url.pathname === '/__posts' && req.method === 'GET') {
            const out: Record<string, string> = {}
            if (existsSync('content/posts')) {
              for (const f of readdirSync('content/posts')) {
                if (f.endsWith('.md')) out[`/content/posts/${f}`] = readFileSync(`content/posts/${f}`, 'utf8')
              }
            }
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify(out))
          }
          // 直接修改已發佈的文章（只允許改已存在的檔，不會新增）
          const edit = url.pathname.match(/^\/__posts\/([a-z0-9][a-z0-9-]*)$/)
          if (edit && req.method === 'PUT') {
            if (!existsSync(`content/posts/${edit[1]}.md`)) return fail(404, '找不到這篇已發佈的文章')
            writeFileSync(`content/posts/${edit[1]}.md`, await readBody(req))
            return res.end('ok')
          }
          const m = url.pathname.match(/^\/__drafts\/([a-z0-9][a-z0-9-]*)$/)
          if (m && req.method === 'PUT') {
            mkdirSync('content/drafts', { recursive: true })
            writeFileSync(`content/drafts/${m[1]}.md`, await readBody(req))
            return res.end('ok')
          }
          const pub = url.pathname.match(/^\/__publish\/([a-z0-9][a-z0-9-]*)$/)
          if (pub && req.method === 'POST') {
            const slug = pub[1]
            if (!existsSync(`content/drafts/${slug}.md`)) return fail(404, '找不到這篇草稿')
            if (existsSync(`content/posts/${slug}.md`)) return fail(409, `content/posts/${slug}.md 已經存在，請先改網址名稱`)
            mkdirSync('content/posts', { recursive: true })
            renameSync(`content/drafts/${slug}.md`, `content/posts/${slug}.md`)
            if (existsSync(`content/drafts/${slug}.en.md`)) renameSync(`content/drafts/${slug}.en.md`, `content/posts/${slug}.en.md`)
            return res.end('ok')
          }
          if (url.pathname === '/__image' && req.method === 'POST') {
            const raw = url.searchParams.get('name') ?? 'image.png'
            const ext = (raw.match(/\.(png|jpe?g|gif|webp|svg)$/i)?.[0] ?? '.png').toLowerCase()
            const base = raw.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'image'
            const name = `${base}-${Date.now().toString(36)}${ext}`
            mkdirSync('public/images', { recursive: true })
            writeFileSync(`public/images/${name}`, await readBody(req))
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ url: `/images/${name}` }))
          }
          return fail(404, 'not found')
        } catch (e) {
          return fail(500, String(e))
        }
      })
    },
  }
}

// 用自己的網域部署時 base 保持 '/'。
export default defineConfig({
  plugins: [react(), sitemap(), draftApi()],
  base: '/',
})
