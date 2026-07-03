const BASE_URL = process.env.NUXT_BASE_URL ?? 'http://localhost:3000'

export function api(path: string) {
  return `${BASE_URL}${path}`
}
