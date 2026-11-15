import { buildPosts, type Post } from './posts'

// 草稿由本機 dev server 的小 API 提供（見 vite.config.ts 的 draftApi），上線版本沒有這個 API
export async function fetchDrafts(): Promise<Post[]> {
  const res = await fetch('/__drafts')
  if (!res.ok) return []
  const files = (await res.json()) as Record<string, string>
  return buildPosts(files).sort((a, b) => b.date.localeCompare(a.date))
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
