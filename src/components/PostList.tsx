import { Link } from 'react-router-dom'
import { tagLabel } from '../data/tags'
import { formatDate, localizePost, type Post } from '../data/posts'
import { useLang } from '../i18n'

export function PostList({ posts: raw, base = '/blog' }: { posts: Post[]; base?: string }) {
  const { lang, t } = useLang()
  const posts = raw.map((p) => localizePost(p, lang))
  if (posts.length === 0) {
    return <p className="muted">{t('post.none')}</p>
  }

  return (
    <ol className="post-list">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link to={`${base}/${post.slug}`}>
            <h3>
              <span className="title">{post.title}</span>
            </h3>
            <p className="description">{post.description}</p>
            <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
            {post.tags.length > 0 && (
              <span className="tags">
                {post.tags.map((t) => (
                  <span key={t} className="tag">
                    #{tagLabel(t, lang)}
                  </span>
                ))}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  )
}
