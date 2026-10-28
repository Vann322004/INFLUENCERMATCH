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
