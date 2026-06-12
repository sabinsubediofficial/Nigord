import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:8787',
      '/servers': 'http://127.0.0.1:8787',
      '/channels': 'http://127.0.0.1:8787',
      '/signaling': 'http://127.0.0.1:8787',
      '/users': 'http://127.0.0.1:8787',
      '/friends': 'http://127.0.0.1:8787',
      '/dms': 'http://127.0.0.1:8787',
      '/invites': 'http://127.0.0.1:8787',
      '/files': 'http://127.0.0.1:8787'
    }
  }
})
