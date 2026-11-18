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
  const portIndex = process.argv.indexOf('--port');
  const requestedPort = process.argv.find(arg => arg.startsWith('--port='))?.split('=')[1]
    || (portIndex >= 0 ? process.argv[portIndex + 1] : '5173');
  const cachePort = /^\d+$/.test(requestedPort || '') ? requestedPort : '5173';
  return {
  cacheDir: `node_modules/.vite_cache/dev-${cachePort}`,
  plugins: [react()],
    input: ['index.html', 'privacy-policy.html'],
  server: {
    proxy: {
      '/crawler-api': {
        target: crawlerTarget,
        changeOrigin: true,
        timeout: 900000,
        rewrite: (path) => path.replace(/^\/crawler-api/, ''),
      },
      '/api/v1/crawl': {
        target: crawlerTarget,
        changeOrigin: true,
        timeout: 900000,
      },
      '/api/v1/monitor': {
        target: crawlerTarget,
        changeOrigin: true,
        timeout: 240000,
      },
      '/api/v1/ai/campaign-autofill': {
        target: 'https://api.influencermatch.site',
        changeOrigin: true,
        secure: false,
        agent: keepAliveAgent,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://api.influencermatch.site');
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
        target: 'https://api.influencermatch.site',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: '',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Match the upstream origin for requests forwarded by the local dev proxy.
            proxyReq.setHeader('Origin', 'https://api.influencermatch.site');
            proxyReq.setHeader('Referer', 'https://api.influencermatch.site/');
            proxyReq.removeHeader('forwarded');
            proxyReq.removeHeader('x-forwarded-host');
          });
        },
      },
    },
  },
  };
})
