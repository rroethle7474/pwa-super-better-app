import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_NAME, APP_SHORT_NAME } from './src/utils/constants'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: APP_NAME,
        short_name: APP_SHORT_NAME,
        description: 'Daily self-reflection journal',
        // Match the real app background (--background in index.css) so the iOS
        // launch background and Android theming align with what renders.
        theme_color: '#0a1024',
        background_color: '#0a1024',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [
          {
            // The client fetches daily quote+image from this edge function
            // (which proxies ZenQuotes + Bing server-side). Serve the cached
            // response instantly and refresh it in the background.
            urlPattern: /\/functions\/v1\/daily-content/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'daily-content-cache',
              expiration: { maxEntries: 2, maxAgeSeconds: 86400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
