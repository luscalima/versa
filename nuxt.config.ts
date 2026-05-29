export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'shadcn-nuxt', '@nuxt/eslint'],
  shadcn: {
    prefix: 'App',
    componentDir: '@/components/ui'
  }
})