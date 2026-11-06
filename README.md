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

## 發布到 GitHub Pages

1. 把根目錄的 `deploy.yml` 移到 `.github/workflows/deploy.yml`（這是自動發布的設定檔）
2. 在 GitHub 建立 repo，把這個專案推上去（main 分支）
3. 到 repo 的 Settings → Pages，Source 選 **GitHub Actions**
4. 之後每次推到 main，網站會自動更新

### 綁定自己的網域

買好網域後：
1. 在 `public/` 新增一個叫 `CNAME` 的檔案，內容只寫網域，例如 `kylemo.tw`
2. 到網域商的 DNS 設定，依照 GitHub Pages 的說明加上紀錄
3. 在 repo 的 Settings → Pages 填入網域，勾選 Enforce HTTPS
