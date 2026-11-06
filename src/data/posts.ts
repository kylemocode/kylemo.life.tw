// 文章清單。新增一篇文章就在 posts 陣列裡加一筆。
// 之後想改用 Markdown 檔案寫文章，可以再換掉這個檔案。

export type Post = {
  slug: string // 網址用的英文代號，例如 my-first-post → /blog/my-first-post
  title: string
  description: string
  date: string // YYYY-MM-DD
  en?: { title: string; description: string; body: string } // 英文版（可省略，沒有就顯示中文）
  tags: string[] // 標籤，例如 ['生活', '筆記']
  featured?: boolean
  body: string // 內文，空一行代表換段落
}

export const posts: Post[] = [
  {
    slug: 'post-1',
    title: '[文章標題 1]',
    description: '[一句話摘要]',
    date: '2026-11-03',
    tags: ['[標籤A]', '[標籤B]'],
    featured: true,
    body: '[第一段內文]\n\n[第二段內文]',
    en: { title: '[Post title 1]', description: '[One-line summary]', body: '[First paragraph]\n\n[Second paragraph]' },
  },
  {
    slug: 'post-2',
    title: '[文章標題 2]',
    description: '[一句話摘要]',
    date: '2026-11-02',
    tags: ['[標籤A]'],
    featured: true,
    body: '[內文]',
    en: { title: '[Post title 2]', description: '[One-line summary]', body: '[Body]' },
  },
  {
    slug: 'post-3',
    title: '[文章標題 3]',
    description: '[一句話摘要]',
    date: '2026-11-01',
    tags: ['[標籤B]'],
    body: '[內文]',
    en: { title: '[Post title 3]', description: '[One-line summary]', body: '[Body]' },
  },
]

export function localizePost(post: Post, lang: 'zh' | 'en'): Post {
  return lang === 'en' && post.en ? { ...post, ...post.en } : post
}

export const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date))
export const featuredPosts = sortedPosts.filter((p) => p.featured)

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
    return [p.title, p.description, p.en?.title ?? '', p.en?.description ?? '', ...p.tags].some((t) => t.toLowerCase().includes(q))
  })
}
