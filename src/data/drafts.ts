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
  return ((await res.json()) as { url: string }).url
}
