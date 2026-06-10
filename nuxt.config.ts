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
  }
})
