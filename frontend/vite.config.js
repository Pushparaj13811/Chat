import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Polyfills to include
      include: [
        'buffer',
        'process',
        'events',
        'stream',
        'util',
        'crypto',
      ]
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // This provides browser versions of Node.js globals like 'global'
      'global': '/src/lib/global-polyfill.js',
    },
  },
  define: {
    // Required for simple-peer
    'process.env': {},
    global: 'globalThis',
  },
})
