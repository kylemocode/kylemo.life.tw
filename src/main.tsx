import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './styles/global.css'
import { LangProvider } from './i18n'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Blog } from './pages/Blog'
import { PostPage } from './pages/PostPage'
const Workspace = lazy(() => import('./pages/Workspace').then((m) => ({ default: m.Workspace })))
import { Preview } from './pages/Preview'
import { NotFound } from './pages/NotFound'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="preview" element={<Preview />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<PostPage />} />
          <Route
            path="workspace"
            element={
              <Suspense fallback={<p className="muted page">…</p>}>
                <Workspace />
              </Suspense>
            }
          />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </LangProvider>
  </StrictMode>,
)

// PWA：只在正式版註冊離線快取（開發時不註冊，免得吃到舊檔案）
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
