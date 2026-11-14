import { loadEnv } from 'vite'

const env = loadEnv('', process.cwd(), '')
const BASE_URL = process.env.NUXT_BASE_URL ?? 'http://localhost:3000'

export function api(path: string, forceGet = false) {
  const baseUrl = appUrl()
  const url = `${baseUrl}/api${path}`

  return forceGet ? url.replace('http', 'http-get') : url
}

export function appUrl() {
  return (env.APP_URL ?? BASE_URL).replace(/\/$/, '')
}
