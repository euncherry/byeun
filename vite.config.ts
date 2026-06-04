import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // React 사본 단일화 (Vercel analytics/speed-insights 등 추가 시 중복 방지)
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
