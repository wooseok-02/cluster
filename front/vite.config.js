import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Cluster',
        short_name: 'Cluster',
        description: '인생 인프라 구축 서비스',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'favicorn.png', sizes: '192x192', type: 'image/png' },
          { src: 'favicorn.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
