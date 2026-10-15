import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [tailwindcss(), tanstackStart({
    spa: {
      enabled: true,
    },
  }), viteReact(), cloudflare({
    viteEnvironment: {
      name: "ssr"
    }
  })],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: [
      '@jsquash/jpeg',
      '@jsquash/png',
      '@jsquash/oxipng',
      '@jsquash/webp',
      '@jsquash/avif',
      '@jsquash/resize',
    ],
  },
})