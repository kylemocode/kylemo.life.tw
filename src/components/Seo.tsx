import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { site } from '../data/site'

// 每個頁面更新分頁標題、description、分享卡片（og）和 canonical。
// 搜尋引擎（Google）會執行 JS 所以看得到；LINE、FB 這類只看原始 HTML，吃的是 index.html 裡的預設值。
const ORIGIN = 'https://kylemo.me'
const DEFAULT_TITLE = '老莫 Kyle Mo | kylemo.life.tw'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function Seo({ title, description, noindex }: { title?: string; description?: string; noindex?: boolean }) {
  const { pathname } = useLocation()
  useEffect(() => {
    const full = title ? `${title} · ${site.title}` : DEFAULT_TITLE
    document.title = full
    const url = ORIGIN + (pathname === '/' ? '/' : pathname.replace(/\/$/, ''))
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = url
    setMeta('meta[property="og:title"]', 'property', 'og:title', title ? `${title} · ${site.title}` : DEFAULT_TITLE)
    setMeta('meta[property="og:url"]', 'property', 'og:url', url)
    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description)
      setMeta('meta[property="og:description"]', 'property', 'og:description', description)
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    }
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex' : 'index, follow')
  }, [title, description, noindex, pathname])
  return null
}
