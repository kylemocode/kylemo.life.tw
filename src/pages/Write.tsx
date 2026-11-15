import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, type Editor, type NodeViewProps } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { fetchDrafts, fetchPublished, fetchRaw, publishDraft, saveDraft, savePost, uploadImage, type Source } from '../data/drafts'
import { buildPosts, parse, type Post } from '../data/posts'
import { tagLabels } from '../data/tags'

// 圖片的對齊與大小都存在 Markdown 圖片的 title，例如 "align:center size:50"
type Align = 'left' | 'center' | 'right'
function parseImgTitle(title: string | null | undefined): { align: Align; size: number } {
  const align = (title?.match(/align:(left|center|right)/)?.[1] ?? 'left') as Align
  const size = Number(title?.match(/size:(\d+)/)?.[1] ?? 100)
  return { align, size: size >= 10 && size <= 100 ? size : 100 }
}
function buildImgTitle(align: Align, size: number): string | null {
  const parts = [align !== 'left' ? `align:${align}` : '', size < 100 ? `size:${size}` : ''].filter(Boolean)
  return parts.length ? parts.join(' ') : null
}

// 圖片：圖下方直接輸入說明（選填，存成 Markdown 的 alt）；對齊存在 title（align:center / align:right）
function ImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { align, size } = parseImgTitle(node.attrs.title as string | null)
  const saved = node.attrs.alt === 'image' ? '' : ((node.attrs.alt as string | null) ?? '') // 早期貼上的預設 alt 不當成說明
  // 輸入法（注音等）組字期間不能改動輸入框的值，所以用本地 state，組字結束才寫回編輯器
  const [text, setText] = useState(saved)
  const composing = useRef(false)
  useEffect(() => {
    if (!composing.current) setText(saved)
  }, [saved])
  return (
    <NodeViewWrapper className={`img-node img-${align}${size < 100 ? ' img-sized' : ''}${selected ? ' sel' : ''}`} style={size < 100 ? { width: `${size}%` } : undefined}>
      <img src={node.attrs.src as string} alt={saved} draggable={false} />
      <input
        className="img-caption"
        value={text}
        placeholder="新增圖片說明（選填）"
        aria-label="圖片說明"
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={(e) => {
          composing.current = false
          updateAttributes({ alt: e.currentTarget.value })
        }}
        onChange={(e) => {
          setText(e.target.value)
          if (!composing.current) updateAttributes({ alt: e.target.value })
        }}
      />
    </NodeViewWrapper>
  )
}

const CaptionImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageView)
  },
  // 圖片是獨立一塊，輸出 Markdown 後要和下一段分開
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const alt = node.attrs.alt === 'image' ? '' : (node.attrs.alt ?? '')
          const title = node.attrs.title ? ` "${String(node.attrs.title).replace(/"/g, '\\"')}"` : ''
          state.write(`![${state.esc(alt)}](${String(node.attrs.src).replace(/[()]/g, '\\$&')}${title})`)
          state.closeBlock(node)
        },
        parse: {},
      },
    }
  },
})

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
  // 選取或游標移動時重畫工具列，按鈕的亮起狀態與圖片對齊按鈕才會跟著變
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    editor.on('transaction', bump)
    return () => {
      editor.off('transaction', bump)
    }
  }, [editor])
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
      {editor.isActive('image') && (
        <>
          <span className="write-toolbar-sep" />
          {(['left', 'center', 'right'] as const).map((a) =>
            btn(
              { left: '圖靠左', center: '圖置中', right: '圖靠右' }[a],
              parseImgTitle(editor.getAttributes('image').title).align === a,
              () => {
                const cur = parseImgTitle(editor.getAttributes('image').title)
                c().updateAttributes('image', { title: buildImgTitle(a, cur.size) }).run()
              },
              '先點選圖片，再選對齊方式',
            ),
          )}
          <span className="write-toolbar-sep" />
          {([25, 50, 75, 100] as const).map((n) =>
            btn(
              `${n}%`,
              parseImgTitle(editor.getAttributes('image').title).size === n,
              () => {
                const cur = parseImgTitle(editor.getAttributes('image').title)
                c().updateAttributes('image', { title: buildImgTitle(cur.align, n) }).run()
              },
              n === 100 ? '原始大小（最寬不超過文章寬度）' : `縮小到文章寬度的 ${n}%`,
            ),
          )}
        </>
      )}
    </div>
  )
}

export function Write() {
  const [params, setParams] = useSearchParams()
  const [list, setList] = useState<Post[]>([])
  const [published, setPublished] = useState<Post[]>([])
  const [meta, setMeta] = useState<Meta>(emptyMeta)
  const [status, setStatus] = useState('')
  const [dirty, setDirty] = useState(false)
  const selfNav = useRef<string | null>(null) // 第一次存檔時我們自己改網址，不要因此重新載入內容
  const loaded = useRef(false) // 載入草稿內容期間不要觸發自動存檔
  const fileInput = useRef<HTMLInputElement>(null)
  const lastImage = useRef({ key: '', at: 0 })
  const metaRef = useRef(meta)
  metaRef.current = meta

  const editor = useEditor({
    extensions: [
      StarterKit,
      CaptionImage,
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
      // 貼上時瀏覽器偶爾會連續觸發兩次，短時間內同一張圖只處理一次
      const key = `${file.name}:${file.size}`
      const now = Date.now()
      if (lastImage.current.key === key && now - lastImage.current.at < 1500) return
      lastImage.current = { key, at: now }
      try {
        const url = await uploadImage(file)
        editor?.chain().focus().setImage({ src: url, alt: '' }).run()
      } catch {
        setStatus('圖片上傳失敗')
      }
    },
    [editor],
  )

  const source: Source = params.get('from') === 'posts' ? 'posts' : 'drafts'
  const refreshList = useCallback(() => {
    void fetchPublished().then(setPublished)
    return fetchDrafts().then(setList)
  }, [])
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
    void fetchRaw(source).then((files) => {
      if (stale || editor.isDestroyed) return
      const all = buildPosts(files)
      const d = all.find((p) => p.slug === slugParam)
      if (d) {
        const raw = files[`/content/${source}/${d.slug}.md`] ?? ''
        // 摘要用檔案裡寫的原值（留空就維持留空），不要把自動產生的摘要寫回檔案
        setMeta({ slug: d.slug, title: d.title, description: parse(raw).meta.description ?? '', date: d.date, tags: d.tags })
        editor.commands.setContent(d.body)
      }
      setDirty(false)
      setStatus('')
      loaded.current = true
    })
    return () => {
      stale = true
    }
  }, [slugParam, source, editor])

  const save = useCallback(async () => {
    const m = metaRef.current
    if (!editor || editor.isDestroyed || !slugOk(m.slug)) {
      setStatus('請先填網址名稱（英文小寫、數字、連字號），才能存檔')
      return
    }
    try {
      const md = (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown()
      await (source === 'posts' ? savePost : saveDraft)(m.slug, toMarkdown(m, md))
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
  }, [editor, refreshList, setParams, slugParam, source])

  // 自動暫存：停筆 1.5 秒後存檔
  useEffect(() => {
    if (!dirty || !slugOk(meta.slug)) return
    // 已發佈的文章不自動存：改完按「儲存」（或 Cmd/Ctrl+S）一次寫入
    if (source === 'posts') {
      setStatus('有尚未儲存的修改，改完請按「儲存」或 Cmd/Ctrl+S')
      return
    }
    setStatus('尚未儲存…')
    const id = setTimeout(() => void save(), 1500)
    return () => clearTimeout(id)
  }, [dirty, meta, save, source])

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

  const exists = slugOk(meta.slug) && (source === 'posts' ? published : list).some((p) => p.slug === meta.slug)

  const publish = async () => {
    if (!exists || source === 'posts') return
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
        <span className="write-status">{status || (source === 'posts' ? '編輯已發佈文章：不會自動儲存，改完按「儲存」寫入 content/posts/，git push 後才會更新線上' : '自動儲存到 content/drafts/')}</span>
        <div className="write-actions">
          {exists && <Link to={source === 'posts' ? `/blog/${meta.slug}` : `/drafts/${meta.slug}`}>預覽成品</Link>}
          <button type="button" className={source === 'posts' && dirty ? 'primary' : ''} onClick={() => void save()}>
            儲存
          </button>
          <button type="button" className="primary" disabled={!exists || source === 'posts'} onClick={() => void publish()}>
            {source === 'posts' ? '已發布' : '發布'}
          </button>
        </div>
      </div>

      <div className="write-drafts" aria-label="草稿">
        <button type="button" className={!slugParam ? 'on' : ''} onClick={() => setParams({})}>
          ＋ 新草稿
        </button>
        {list.map((p) => (
          <button key={p.slug} type="button" className={source === 'drafts' && p.slug === slugParam ? 'on' : ''} onClick={() => setParams({ slug: p.slug })}>
            {p.title || p.slug}
          </button>
        ))}
      </div>
      {published.length > 0 && (
        <div className="write-drafts" aria-label="已發佈的文章">
          <span className="write-drafts-label">已發佈</span>
          {published.map((p) => (
            <button key={p.slug} type="button" className={source === 'posts' && p.slug === slugParam ? 'on' : ''} onClick={() => setParams({ slug: p.slug, from: 'posts' })}>
              {p.title || p.slug}
            </button>
          ))}
        </div>
      )}

      <input className="write-title" value={meta.title} placeholder="標題" aria-label="標題" onChange={(e) => set({ title: e.target.value })} />
      <input
        className="write-desc"
        value={meta.description}
        placeholder="摘要（選填，留空會自動取內文開頭）"
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
