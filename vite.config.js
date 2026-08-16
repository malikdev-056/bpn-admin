import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000'

  const proxyConfig = {
    target: proxyTarget,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        // Server-side proxy — drop Origin so backend CORS never blocks dev traffic.
        proxyReq.removeHeader('origin')
      })
    },
  }

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/api': proxyConfig,
        '/uploads': proxyConfig,
      },
    },
  }
})
