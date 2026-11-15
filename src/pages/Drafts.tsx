import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PostList } from '../components/PostList'
import { Seo } from '../components/Seo'
import { fetchDrafts } from '../data/drafts'
import type { Post } from '../data/posts'

// 草稿預覽：只在本機開發時有路由，上線後網址會落到 404
export function Drafts() {
  const [drafts, setDrafts] = useState<Post[]>([])
  useEffect(() => {
    fetchDrafts().then(setDrafts)
  }, [])
  return (
    <section className="page">
      <Seo title="草稿" noindex />
      <h1>草稿</h1>
      <p className="meta">
        content/drafts/ 裡的 .md，只有本機看得到 · <Link to="/write">開始寫作</Link>
      </p>
      <PostList posts={drafts} base="/drafts" />
    </section>
  )
}
