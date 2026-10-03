import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  appType: 'spa', // Ensures all routes fallback to index.html (SPA mode)
  define: {
    global: 'window',
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Ensure Spring Boot's CORS validator sees an allowed origin
            proxyReq.setHeader('Origin', 'http://localhost:5173');
          });
        }
      },
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
