import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    // ─── Dev прокси: имитация nginx в режиме разработки ──────────────
    // В production nginx проксирует /api/ → api-gateway:8080
    // и /ws/ → websocket-service:8090.
    // В dev-режиме Vite делает то же самое.
    proxy: {
      // REST API → API Gateway :8080
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // WebSocket → WebSocket Service :8090
      '/ws': {
        target: 'ws://localhost:8090',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
