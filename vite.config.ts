import { readdirSync, readFileSync } from 'node:fs'
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

// 用自己的網域部署時 base 保持 '/'。
export default defineConfig({
  plugins: [react(), sitemap()],
  base: '/',
})
