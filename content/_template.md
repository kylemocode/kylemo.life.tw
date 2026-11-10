---
title: 文章標題
description: 一句話摘要,會顯示在文章列表和搜尋結果
date: 2026-11-08
tags: [life, career]
---

這個檔案是範本,不會出現在網站上(只有 `content/posts/` 底下的 `.md` 才會被讀取)。

使用方式:複製這個檔案到 `content/posts/`,改名成 `my-post.md`。檔名就是網址,例如 `/blog/my-post`,請用英文小寫加連字號。

## Frontmatter 欄位(最上面 `---` 之間)

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `title` | 是 | 文章標題 |
| `description` | 是 | 一句話摘要 |
| `date` | 是 | 格式 `YYYY-MM-DD`,列表依日期新到舊排序 |
| `tags` | 否 | 寫標籤 key,可多個。只能用 `src/data/tags.ts` 裡定義的:`life`、`career`、`nomad`。沒定義的會被忽略 |

## 內文語法

一般段落,空一行換段。**粗體**、*斜體*、`行內程式碼`、[連結](https://kylemo.me)。

### 三級標題

- 無序清單
- 第二項

1. 有序清單
2. 第二項

> 引用文字

```ts
// 程式碼區塊,``` 後面可以標語言
const hello = (name: string) => `Hello, ${name}`
```

圖片:先放進 `public/images/`,再用下面的寫法引用。

![圖片說明](/images/pic.png)

---

上面那條是分隔線。

## 英文版(選填)

另外建立同名的 `my-post.en.md`,英文版只需要 `title` 和 `description`(日期和標籤沿用中文版),內文寫英文。沒有英文版時,英文模式會顯示中文。範本見 `content/_template.en.md`。
