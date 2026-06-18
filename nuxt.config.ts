import { cpSync, mkdirSync } from 'node:fs'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxt/eslint',
    '@nuxt/test-utils/module'
  ],
  shadcn: {
    prefix: 'App',
    componentDir: '@/components/ui'
  },
  runtimeConfig: {
    database: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      name: process.env.DB_NAME
    }
  },
  hooks: {
    'nitro:build:public-assets'() {
      // preserve migrations directory in the output for production
      mkdirSync('./server/infra/database/migrations', { recursive: true })
      cpSync(
        './server/infra/database/migrations',
        './.output/server/infra/database/migrations',
        { recursive: true }
      )
    }
  }
})
