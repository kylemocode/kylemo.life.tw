import { useMemo } from 'react'
import { marked } from 'marked'
import { Link, useParams } from 'react-router-dom'
import { drafts, formatDate, localizePost, posts } from '../data/posts'
import { tagLabel } from '../data/tags'
import { Seo } from '../components/Seo'
import { MagneticLink } from '../components/MagneticLink'
import { NotFound } from './NotFound'
import { useLang } from '../i18n'

export function PostPage({ draft = false }: { draft?: boolean }) {
  const { slug } = useParams()
  const { lang, t } = useLang()
  const found = (draft ? drafts : posts).find((p) => p.slug === slug)
  const post = found && localizePost(found, lang)

  const html = useMemo(() => (post ? (marked.parse(post.body, { async: false }) as string) : ''), [post])

  if (!post) return <NotFound />

  return (
    <article className="page">
      {draft && <p className="meta">草稿預覽（只在本機看得到）</p>}
      <Seo title={post.title} description={post.description} />
      <h1>{post.title}</h1>
      <p className="meta">
        <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
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
      <p className="post-back">
        <MagneticLink to={draft ? '/drafts' : '/blog'} small>
          {draft ? '所有草稿' : t('post.back')}
        </MagneticLink>
      </p>
    </article>
  )
}
