import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { APP_NAME, APP_SHORT_NAME } from './src/utils/constants'

export default defineConfig({
  base: '/SuperLoser/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: APP_NAME,
        short_name: APP_SHORT_NAME,
        description: 'Daily self-reflection journal',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
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
            urlPattern: /^https:\/\/zenquotes\.io\/api/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'quotes-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: /^https:\/\/www\.bing\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bing-image-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],
})
