import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project-site deployment: https://moughton.github.io/Control-Center/
  // — everything (asset paths, PWA scope/start_url below) must be aware of this subpath,
  // not just the domain root.
  base: '/Control-Center/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Control Center',
        short_name: 'Control Center',
        description: 'Quick-capture companion for the personal control center — recurring tasks, GTG, and more.',
        theme_color: '#7c3aed',
        background_color: '#fafafa',
        display: 'standalone',
        start_url: '/Control-Center/',
        scope: '/Control-Center/',
        icons: [
          { src: 'pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      // NOTE: SVG-only icons work on modern Chrome/Edge (Android/Windows/Mac install),
      // but dedicated 192x192 / 512x512 PNGs are worth adding later for broader
      // compatibility (older browsers, some iOS "Add to Home Screen" flows) — flagged
      // rather than blocking this pass on icon design.
    }),
  ],
})
