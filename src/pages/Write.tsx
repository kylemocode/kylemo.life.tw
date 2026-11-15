import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { fetchDrafts, publishDraft, saveDraft, uploadImage } from '../data/drafts'
import type { Post } from '../data/posts'
import { tagLabels } from '../data/tags'

// 本機寫作頁：所見即所得編輯，自動存成 content/drafts/<slug>.md。只在 localhost 有路由。
const today = () => new Date().toLocaleDateString('sv') // YYYY-MM-DD

type Meta = { slug: string; title: string; description: string; date: string; tags: string[] }
const emptyMeta = (): Meta => ({ slug: '', title: '', description: '', date: today(), tags: [] })

function toMarkdown(meta: Meta, body: string) {
  const fm = [
    '---',
    `title: ${meta.title}`,
    `description: ${meta.description}`,
    `date: ${meta.date}`,
    `tags: [${meta.tags.join(', ')}]`,
    '---',
    '',
  ].join('\n')
  return fm + body.trim() + '\n'
}

const slugOk = (s: string) => /^[a-z0-9][a-z0-9-]*$/.test(s)

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const btn = (label: string, active: boolean, run: () => void, title: string) => (
    <button type="button" className={active ? 'on' : ''} title={title} onMouseDown={(e) => e.preventDefault()} onClick={run}>
      {label}
    </button>
  )
  const link = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('連結網址（留空移除）', prev ?? 'https://')
    if (url === null) return
    if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
  const c = () => editor.chain().focus()
  return (
    <div className="write-toolbar" role="toolbar" aria-label="格式">
      {btn('B', editor.isActive('bold'), () => c().toggleBold().run(), '粗體')}
      {btn('I', editor.isActive('italic'), () => c().toggleItalic().run(), '斜體')}
      {btn('H2', editor.isActive('heading', { level: 2 }), () => c().toggleHeading({ level: 2 }).run(), '大標題')}
      {btn('H3', editor.isActive('heading', { level: 3 }), () => c().toggleHeading({ level: 3 }).run(), '小標題')}
      {btn('• 清單', editor.isActive('bulletList'), () => c().toggleBulletList().run(), '無序清單')}
      {btn('1. 清單', editor.isActive('orderedList'), () => c().toggleOrderedList().run(), '有序清單')}
      {btn('❝ 引用', editor.isActive('blockquote'), () => c().toggleBlockquote().run(), '引用')}
      {btn('</>', editor.isActive('codeBlock'), () => c().toggleCodeBlock().run(), '程式碼區塊')}
      {btn('連結', editor.isActive('link'), link, '連結')}
      {btn('圖片', false, onImage, '插入圖片（也可以直接貼上或拖進來）')}
      {btn('—', false, () => c().setHorizontalRule().run(), '分隔線')}
    </div>
  )
}

export function Write() {
  const [params, setParams] = useSearchParams()
  const [list, setList] = useState<Post[]>([])
  const [meta, setMeta] = useState<Meta>(emptyMeta)
  const [status, setStatus] = useState('')
  const [dirty, setDirty] = useState(false)
  const selfNav = useRef<string | null>(null) // 第一次存檔時我們自己改網址，不要因此重新載入內容
  const loaded = useRef(false) // 載入草稿內容期間不要觸發自動存檔
  const fileInput = useRef<HTMLInputElement>(null)
  const metaRef = useRef(meta)
  metaRef.current = meta

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({ placeholder: '在這裡開始寫…' }),
      Markdown.configure({ html: false, tightLists: true, linkify: false }),
    ],
    editorProps: {
      attributes: { class: 'prose write-body' },
      handlePaste(_v, e) {
        const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith('image/'))
        if (!f) return false
        void insertImage(f)
        return true
      },
      handleDrop(_v, e) {
        const f = Array.from(e.dataTransfer?.files ?? []).find((x) => x.type.startsWith('image/'))
        if (!f) return false
        e.preventDefault()
        void insertImage(f)
        return true
      },
    },
    onUpdate: () => {
      if (loaded.current) setDirty(true)
    },
  })

  const insertImage = useCallback(
    async (file: File) => {
      try {
        const url = await uploadImage(file)
        editor?.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, '') }).run()
      } catch {
        setStatus('圖片上傳失敗')
      }
    },
    [editor],
  )

  const refreshList = useCallback(() => fetchDrafts().then(setList), [])
  useEffect(() => {
    void refreshList()
  }, [refreshList])

  // 依網址的 ?slug= 載入草稿（沒有就是新草稿）
  const slugParam = params.get('slug')
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (selfNav.current && selfNav.current === slugParam) {
      selfNav.current = null
      return
    }
    let stale = false
    loaded.current = false
    if (!slugParam) {
      setMeta(emptyMeta())
      editor.commands.setContent('')
      setDirty(false)
      loaded.current = true
      return
    }
    void fetchDrafts().then((all) => {
      if (stale || editor.isDestroyed) return
      const d = all.find((p) => p.slug === slugParam)
      if (d) {
        setMeta({ slug: d.slug, title: d.title, description: d.description, date: d.date, tags: d.tags })
        editor.commands.setContent(d.body)
      }
      setDirty(false)
      setStatus('')
      loaded.current = true
    })
    return () => {
      stale = true
    }
  }, [slugParam, editor])

  const save = useCallback(async () => {
    const m = metaRef.current
    if (!editor || editor.isDestroyed || !slugOk(m.slug)) {
      setStatus('請先填網址名稱（英文小寫、數字、連字號），才能存檔')
      return
    }
    try {
      const md = (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown()
      await saveDraft(m.slug, toMarkdown(m, md))
      setDirty(false)
      setStatus(`已儲存 ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`)
      void refreshList()
      if (slugParam !== m.slug) {
        selfNav.current = m.slug
        setParams({ slug: m.slug }, { replace: true })
      }
    } catch {
      setStatus('儲存失敗（dev server 有開著嗎？）')
    }
  }, [editor, refreshList, setParams, slugParam])

  // 自動暫存：停筆 1.5 秒後存檔
  useEffect(() => {
    if (!dirty || !slugOk(meta.slug)) return
    setStatus('尚未儲存…')
    const id = setTimeout(() => void save(), 1500)
    return () => clearTimeout(id)
  }, [dirty, meta, save])

  // 有未存的變更時，關閉分頁會提醒
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // Cmd/Ctrl+S 手動存檔
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        void save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save])

  const set = (patch: Partial<Meta>) => {
    setMeta((m) => ({ ...m, ...patch }))
    if (loaded.current) setDirty(true)
  }
  const toggleTag = (k: string) => set({ tags: meta.tags.includes(k) ? meta.tags.filter((t) => t !== k) : [...meta.tags, k] })

  const exists = slugOk(meta.slug) && list.some((p) => p.slug === meta.slug)

  const publish = async () => {
    if (!exists) return
    if (!window.confirm(`發布「${meta.title || meta.slug}」？\n檔案會從 content/drafts/ 移到 content/posts/，之後 git push 就會上線。`)) return
    await save()
    try {
      await publishDraft(meta.slug)
      setStatus(`已移到 content/posts/${meta.slug}.md，記得 git push 才會上線`)
      setDirty(false)
      await refreshList()
      setParams({}, { replace: true })
    } catch (e) {
      setStatus(String(e instanceof Error ? e.message : e))
    }
  }

  return (
    <section className="page write">
      <Seo title="寫作" noindex />

      <div className="write-top">
        <span className="write-status">{status || '自動儲存到 content/drafts/'}</span>
        <div className="write-actions">
          {exists && <Link to={`/drafts/${meta.slug}`}>預覽成品</Link>}
          <button type="button" onClick={() => void save()}>
            儲存
          </button>
          <button type="button" className="primary" disabled={!exists} onClick={() => void publish()}>
            發布
          </button>
        </div>
      </div>

      <div className="write-drafts" aria-label="草稿">
        <button type="button" className={!slugParam ? 'on' : ''} onClick={() => setParams({})}>
          ＋ 新草稿
        </button>
        {list.map((p) => (
          <button key={p.slug} type="button" className={p.slug === slugParam ? 'on' : ''} onClick={() => setParams({ slug: p.slug })}>
            {p.title || p.slug}
          </button>
        ))}
      </div>

      <input className="write-title" value={meta.title} placeholder="標題" aria-label="標題" onChange={(e) => set({ title: e.target.value })} />
      <input
        className="write-desc"
        value={meta.description}
        placeholder="一句話摘要，會顯示在文章列表和搜尋結果"
        aria-label="摘要"
        onChange={(e) => set({ description: e.target.value })}
      />

      <div className="write-meta">
        <label>
          <span>網址</span>
          <input
            value={meta.slug}
            placeholder="my-first-post"
            readOnly={Boolean(slugParam)}
            title={slugParam ? '存檔後不能改，要改請重新命名檔案' : '英文小寫、數字、連字號'}
            onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
          />
        </label>
        <label>
          <span>日期</span>
          <input type="date" value={meta.date} onChange={(e) => set({ date: e.target.value })} />
        </label>
        <div className="write-tags">
          {Object.entries(tagLabels).map(([k, v]) => (
            <button key={k} type="button" className={meta.tags.includes(k) ? 'on' : ''} onClick={() => toggleTag(k)}>
              #{v.zh}
            </button>
          ))}
        </div>
      </div>

      {editor && <Toolbar editor={editor} onImage={() => fileInput.current?.click()} />}
      <EditorContent editor={editor} className="write-editor" />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void insertImage(f)
          e.target.value = ''
        }}
      />
    </section>
  )
}
