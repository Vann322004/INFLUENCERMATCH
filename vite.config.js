import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import https from 'https'

const keepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  keepAliveMsecs: 60000,
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const crawlerTarget = env.CRAWLER_PROXY_TARGET || 'http://127.0.0.1:8000';
  return {
  plugins: [react()],
  server: {
    proxy: {
      '/crawler-api': {
        target: crawlerTarget,
        changeOrigin: true,
        timeout: 120000,
        rewrite: (path) => path.replace(/^\/crawler-api/, ''),
      },
      '/api/v1/crawl': {
        target: crawlerTarget,
        changeOrigin: true,
        timeout: 120000,
      },
      '/api/v1/monitor': {
        target: crawlerTarget,
        changeOrigin: true,
        timeout: 120000,
      },
      '/api/v1/ai/campaign-autofill': {
        target: 'https://api.influencermatch.site',
        changeOrigin: true,
        secure: false,
        agent: keepAliveAgent,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:5173');
          });
        },
      },
      '/api/v1/ai': {
        target: crawlerTarget,
        changeOrigin: true,
        timeout: 120000,
      },
      '/api/v1/quality': {
        target: crawlerTarget,
        changeOrigin: true,
        timeout: 120000,
      },
      '/api/v1/candidates': {
        target: crawlerTarget,
        changeOrigin: true,
        timeout: 120000,
      },
      '/api': {
        target: 'http://221.121.3.226:8080',
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
  };
})
