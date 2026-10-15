import { defineConfig } from 'cf/config'

export default defineConfig({
  worker: {
    name: 'happier-image',
    compatibilityDate: '2026-10-06',
    domains: ['image.happier.io.vn'],
    observability: {
      enabled: true,
    },
    entrypoint: '@tanstack/react-start/server-entry',
  },
})
