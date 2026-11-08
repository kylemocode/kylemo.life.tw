
import { tagLabels } from './tags'

export type Post = {
  slug: string // 網址用的英文代號，例如 my-first-post → /blog/my-first-post
  title: string
  description: string
  date: string // YYYY-MM-DD
  en?: { title: string; description: string; body: string } // 英文版（可省略，沒有就顯示中文）
  tags: string[] // 標籤 key，例如 ['life', 'career']
  body: string // Markdown 內文
}

// 文章放在專案根目錄的 content/posts/ 底下：
//   my-post.md      中文版（必要，含 title、description、date、tags）
//   my-post.en.md   英文版（可省略，只需 title、description；沒有就顯示中文）
// tags 寫 src/data/tags.ts 裡的 key（例如 [life, career]），中英文名稱由對照表決定
// 檔名（不含副檔名）就是網址：content/posts/my-post.md → /blog/my-post
const files = import.meta.glob('/content/posts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function parse(raw: string) {
  const m = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const meta: Record<string, string> = {}
  if (!m) return { meta, body: raw.trim() }
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return { meta, body: m[2].trim() }
}

function parseTags(v = '', slug = '') {
  const all = v
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((t) => t.trim().replace(/^(['"])(.*)\1$/, '$2'))
    .filter(Boolean)
  // 只保留 tags.ts 裡定義過的標籤，其餘忽略（開發時在 console 提醒）
  const valid = all.filter((k) => k in tagLabels)
  if (import.meta.env.DEV && valid.length < all.length) {
    console.warn(`[posts] ${slug}: 未定義的標籤已忽略 → ${all.filter((k) => !(k in tagLabels)).join(', ')}（請加到 src/data/tags.ts）`)
  }
  return valid
}

const zh: Record<string, string> = {}
const en: Record<string, string> = {}
for (const [path, raw] of Object.entries(files)) {
  const name = path.split('/').pop()!.replace(/\.md$/, '')
  if (name.endsWith('.en')) en[name.slice(0, -3)] = raw
  else zh[name] = raw
}

export const posts: Post[] = Object.entries(zh).map(([slug, raw]) => {
  const { meta, body } = parse(raw)
  const post: Post = {
    slug,
    title: meta.title || slug,
    description: meta.description || '',
    date: meta.date || '1970-01-01',
    tags: parseTags(meta.tags, slug),
    body,
  }
  if (en[slug]) {
    const e = parse(en[slug])
    post.en = { title: e.meta.title || post.title, description: e.meta.description || post.description, body: e.body }
  }
  return post
})

export function localizePost(post: Post, lang: 'zh' | 'en'): Post {
  return lang === 'en' && post.en ? { ...post, ...post.en } : post
}

export const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date))

export function formatDate(date: string, lang: 'zh' | 'en' = 'zh') {
  const [y, m, d] = date.split('-').map(Number)
  if (lang === 'en') {
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
  }
  return `${y} 年 ${m} 月 ${d} 日`
}

export function countWords(text: string) {
  // 中文一字算一字，英文一個單字算一字
  const cjk = text.match(/[㐀-鿿]/g)?.length ?? 0
  const latin = text.replace(/[㐀-鿿]/g, ' ').match(/[A-Za-z0-9]+/g)?.length ?? 0
  return cjk + latin
}

export const allTags = [...new Set(posts.flatMap((p) => p.tags))].sort()

// 用標題、摘要或標籤搜尋（不分大小寫）；tag 有值時只留下有該標籤的文章
export function filterPosts(list: Post[], query: string, tag: string) {
  const q = query.trim().toLowerCase()
  return list.filter((p) => {
    if (tag && !p.tags.includes(tag)) return false
    if (!q) return true
    const labels = p.tags.flatMap((k) => [k, tagLabels[k]?.zh ?? '', tagLabels[k]?.en ?? ''])
    return [p.title, p.description, p.en?.title ?? '', p.en?.description ?? '', ...labels].some((t) => t.toLowerCase().includes(q))
  })
}
