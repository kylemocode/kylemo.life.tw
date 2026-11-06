import { useSearchParams } from 'react-router-dom'
import { allTags, filterPosts, sortedPosts } from '../data/posts'
import { useLang } from '../i18n'
import { PostList } from '../components/PostList'

export function Blog() {
  const { t } = useLang()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const tag = params.get('tag') ?? ''
  const shown = filterPosts(sortedPosts, query, tag)

  function update(next: { q?: string; tag?: string }) {
    const merged = { q: query, tag, ...next }
    const out = new URLSearchParams()
    if (merged.q) out.set('q', merged.q)
    if (merged.tag) out.set('tag', merged.tag)
    setParams(out, { replace: true })
  }

  return (
    <section className="page">
      <h1>{t('blog.title')}</h1>
      <p className="meta">
        {query || tag ? t('blog.found', { n: shown.length, total: sortedPosts.length }) : t('blog.count', { n: sortedPosts.length })}
      </p>

      <input
        type="search"
        className="search"
        placeholder={t('blog.search')}
        aria-label={t('blog.searchLabel')}
        value={query}
        onChange={(e) => update({ q: e.target.value })}
      />

      {allTags.length > 0 && (
        <div className="tags tag-filter">
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              className="tag"
              aria-pressed={t === tag}
              onClick={() => update({ tag: t === tag ? '' : t })}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? <p className="muted">{t('blog.empty')}</p> : <PostList posts={shown} />}
    </section>
  )
}
