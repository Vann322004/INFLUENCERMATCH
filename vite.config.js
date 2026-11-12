import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import https from 'https'

const keepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  keepAliveMsecs: 60000,
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/crawler-api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 120000,
        rewrite: (path) => path.replace(/^\/crawler-api/, ''),
      },
      '/api/v1/crawl': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 120000,
      },
      '/api/v1/monitor': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 120000,
      },
      '/api/v1/ai': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 120000,
      },
      '/api/v1/quality': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 120000,
      },
      '/api/v1/candidates': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 120000,
      },
      '/api': {
        target: 'https://api.influencermatch.site',
        changeOrigin: true,
        secure: false,
        agent: keepAliveAgent,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Chuẩn hóa Origin về http://localhost:5173 để khớp chính xác với whitelist CORS của Backend Spring Boot
            proxyReq.setHeader('Origin', 'http://localhost:5173');
          });
        },
      },
    },
  },
})
