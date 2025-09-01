import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/opencv-test/',
  
  server: {
    // パフォーマンス向上と、特定のAPIを有効化するためのヘッダーを追加します
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    // 開発サーバー起動時に自動でブラウザを開くようにします
    open: true,
  },
})