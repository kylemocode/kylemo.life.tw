import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 用自己的網域部署時 base 保持 '/'。
// 如果先用 https://<帳號>.github.io/kylemo.life.tw/ 預覽，改成 base: '/kylemo.life.tw/'
export default defineConfig({
  plugins: [react()],
  base: '/',
})
