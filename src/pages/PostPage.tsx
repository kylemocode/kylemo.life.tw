import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDate, localizePost, posts } from '../data/posts'
import { site } from '../data/site'
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
              #{t}
            </Link>
          ))}
        </p>
      )}
      <div className="prose">
        {post.body.split(/\n\s*\n/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      <p>
        <Link to="/blog" className="muted">
          {t('post.back')}
        </Link>
      </p>
    </article>
  )
}
