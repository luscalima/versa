const BASE_URL = process.env.NUXT_BASE_URL ?? 'http://localhost:3000'

export function api(path: string, forceGet = false) {
  const url = `${BASE_URL}${path}`

  return forceGet ? url.replace('http', 'http-get') : url
}
