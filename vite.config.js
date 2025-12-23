import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)) // 别名配置
    }
  },
  server: {
    port: 5173,         // 指定固定端口
    strictPort: true,   // 如果端口已被占用直接报错
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端服务地址
        changeOrigin: true,              // 允许跨域
        secure: false,                   // HTTP 后端时设为 false
        rewrite: (path) => path.replace(/^\/api/, '') // 重写路径，移除/api前缀
      }
    }
  }
})