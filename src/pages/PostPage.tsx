import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import { Link, useParams } from 'react-router-dom'
import { fetchDrafts } from '../data/drafts'
import { formatDate, localizePost, posts, type Post } from '../data/posts'
import { tagLabel } from '../data/tags'
import { AuthorBox } from '../components/AuthorBox'
import { Seo } from '../components/Seo'
import { NotFound } from './NotFound'
import { useLang } from '../i18n'

export function PostPage({ draft = false }: { draft?: boolean }) {
  const { slug } = useParams()
  const { lang, t } = useLang()
  const [drafts, setDrafts] = useState<Post[] | null>(draft ? null : [])
  useEffect(() => {
    if (draft) fetchDrafts().then(setDrafts)
  }, [draft])
  const found = (draft ? drafts ?? [] : posts).find((p) => p.slug === slug)
  const post = found && localizePost(found, lang)

  // 單獨一行的圖片轉成 <figure>：alt 當圖片說明，title 寫 "align:center size:50" 決定對齊與縮放
  const html = useMemo(
    () =>
      post
        ? (marked.parse(post.body, { async: false }) as string).replace(/<p>(<img [^>]*>)<\/p>/g, (_m, img: string) => {
            const attr = (k: string) => img.match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? ''
            const align = attr('title').match(/align:(left|center|right)/)?.[1] ?? 'left'
            const size = Number(attr('title').match(/size:(\d+)/)?.[1] ?? 100)
            const sized = size >= 10 && size < 100
            const alt = attr('alt') === 'image' ? '' : attr('alt') // 早期貼上的圖 alt 是預設的 image，不當成說明
            return `<figure class="fig fig-${align}${sized ? ' fig-sized' : ''}"${sized ? ` style="width:${size}%"` : ''}><img src="${attr('src')}" alt="${alt}" loading="lazy">${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`
          })
        : '',
    [post],
  )

  if (draft && drafts === null) return <p className="muted page">…</p>
  if (!post) return <NotFound />

  return (
    <article className="page">
      {draft && (
        <p className="draft-bar">
          <Link className="btn-accent btn-sm" to={`/write?slug=${post.slug}`}>
            ← 回編輯器
          </Link>
          <span className="meta">草稿預覽（只在本機看得到）</span>
        </p>
      )}
      <Seo title={post.title} description={post.description} />
      <h1>{post.title}</h1>
      <p className="meta">
        <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
      </p>
      <p className="byline">
        <Link className="byline-who" to="/about">
          <img src={`${import.meta.env.BASE_URL}avatar-home.png`} alt="" width="32" height="32" />
          <span>莫力全 Kyle Mo</span>
        </Link>
      </p>
      {post.tags.length > 0 && (
        <p className="tags">
          {post.tags.map((t) => (
            <Link key={t} className="tag" to={`/blog?tag=${encodeURIComponent(t)}`}>
              #{tagLabel(t, lang)}
            </Link>
          ))}
        </p>
      )}
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      <AuthorBox />
      <p className="post-back">
        <Link className="btn-accent btn-static" to={draft ? '/drafts' : '/blog'}>
          {draft ? '所有草稿' : t('post.back')}
        </Link>
      </p>
    </article>
  )
}
