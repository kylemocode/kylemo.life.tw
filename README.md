# kylemo.life.tw

Kyle 的個人部落格，用 React + Vite 建置。

## 在自己電腦上跑起來

需要先安裝 [Node.js](https://nodejs.org/)（選 LTS 版本）。

```bash
npm install     # 第一次要先安裝套件
npm run dev     # 開啟本機預覽，瀏覽器打開終端機顯示的網址（通常是 http://localhost:5173）
```

## 常改的地方

| 想改什麼 | 檔案 |
| --- | --- |
| 網站名稱、副標、打字機關鍵詞、社群連結 | `src/data/site.ts` |
| 新增或修改文章 | `src/data/posts.ts` |
| 顏色、字體、間距 | `src/styles/global.css`（最上面的 `:root`） |
| 頁面內容 | `src/pages/` |

## 資料夾結構

```
src/
  main.tsx          網址路由（哪個網址顯示哪一頁）
  components/       共用元件：頂部、頁尾、文章清單、打字機效果、圖示
  pages/            各頁面：首頁、長文、單篇文章、施工中頁面、404
  data/             網站設定與文章
  styles/           全站樣式
public/             直接放上網站的檔案（網站圖示等）
```

## 發布到 Vercel

1. 到 [vercel.com](https://vercel.com) 用 GitHub 登入，Add New → Project，選這個 repo
2. 設定保持預設（Framework 會自動認成 Vite；建置與輸出已寫在 `vercel.json`）
3. 之後每次推到 `main` 會自動發布，其他分支與 PR 會有預覽網址

### 綁定自己的網域

在 Vercel 專案的 Settings → Domains 加入 `kylemo.life.tw`，再依畫面指示到網域商的 DNS 加上紀錄（子網域用 CNAME，根網域用 A 記錄）。

### 改版後讓離線快取更新

離線快取在 `public/sw.js`，改版想強制換新時把檔案開頭的 `VERSION` 加一。
