import { renderOgCard } from './shareCard'
import { excerpt, formatDate } from '../data/posts'

// 連結預覽圖由本機瀏覽器畫好，經 dev server 存成 public/og/<name>.png，之後跟著文章一起 commit
export async function saveOgImage(name: string, blob: Blob) {
  const res = await fetch(`/__og/${name}`, { method: 'PUT', body: blob })
  if (!res.ok) throw new Error(await res.text())
}

export async function generatePostOg(p: { slug: string; title: string; description: string; date: string; body: string }) {
  const summary = p.description || excerpt(p.body)
  const footerRight = formatDate(p.date, 'zh')
  await saveOgImage(p.slug, await renderOgCard({ title: p.title, summary, footerRight }))
}

export async function generateHomeOg() {
  await saveOgImage('home', await renderOgCard({ title: '一個老靈魂的文字遊樂場', summary: '透過文字創作打造的人生遊樂場' }))
}
