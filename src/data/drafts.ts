import { buildPosts, type Post } from './posts'

// 草稿由本機 dev server 的小 API 提供（見 vite.config.ts 的 draftApi），上線版本沒有這個 API
export type Source = 'drafts' | 'posts'

// 讀出原始檔案內容（含 frontmatter），編輯器用它來保留「摘要留空」這類原始狀態
export async function fetchRaw(source: Source): Promise<Record<string, string>> {
  const res = await fetch(`/__${source}`)
  if (!res.ok) return {}
  return (await res.json()) as Record<string, string>
}

export async function fetchDrafts(): Promise<Post[]> {
  return buildPosts(await fetchRaw('drafts')).sort((a, b) => b.date.localeCompare(a.date))
}

// 已發佈的文章（編輯用，直接讀 content/posts/）
export async function fetchPublished(): Promise<Post[]> {
  return buildPosts(await fetchRaw('posts')).sort((a, b) => b.date.localeCompare(a.date))
}

export async function savePost(slug: string, markdown: string) {
  const res = await fetch(`/__posts/${slug}`, { method: 'PUT', body: markdown })
  if (!res.ok) throw new Error(await res.text())
}

export async function saveDraft(slug: string, markdown: string) {
  const res = await fetch(`/__drafts/${slug}`, { method: 'PUT', body: markdown })
  if (!res.ok) throw new Error(await res.text())
}

export async function uploadImage(file: File): Promise<string> {
  const res = await fetch(`/__image?name=${encodeURIComponent(file.name)}`, { method: 'POST', body: file })
  if (!res.ok) throw new Error(await res.text())
  const { url } = (await res.json()) as { url: string }
  // dev server 要過一下才認得新檔案（之前會先回 HTML 導致圖片破圖），等它真的回圖片再插入
  for (let i = 0; i < 20; i++) {
    const r = await fetch(url, { cache: 'no-store' })
    if ((r.headers.get('content-type') ?? '').startsWith('image/')) break
    await new Promise((ok) => setTimeout(ok, 150))
  }
  return url
}

// 發布 = 把 content/drafts/<slug>.md（和 .en.md）移到 content/posts/
export async function publishDraft(slug: string) {
  const res = await fetch(`/__publish/${slug}`, { method: 'POST' })
  if (!res.ok) throw new Error(await res.text())
}
