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
      },
    },
  },
})
