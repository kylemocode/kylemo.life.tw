import { useEffect, useMemo } from 'react'
import { marked } from 'marked'
import { Link, useParams } from 'react-router-dom'
import { formatDate, localizePost, posts } from '../data/posts'
import { tagLabel } from '../data/tags'
import { site } from '../data/site'
import { MagneticLink } from '../components/MagneticLink'
import { NotFound } from './NotFound'
import { useLang } from '../i18n'

export function PostPage() {
  const { slug } = useParams()
  const { lang, t } = useLang()
  const found = posts.find((p) => p.slug === slug)
  const post = found && localizePost(found, lang)

  useEffect(() => {
    if (post) document.title = `${post.title} · ${site.title}`
    return () => {
      document.title = site.title
    }
  }, [post])

  const html = useMemo(() => (post ? (marked.parse(post.body, { async: false }) as string) : ''), [post])

  if (!post) return <NotFound />

  return (
    <article className="page">
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
        <MagneticLink to="/blog" small>
          {t('post.back')}
        </MagneticLink>
      </p>
    </article>
  )
}
