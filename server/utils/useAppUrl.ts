const LOCAL_APP_URL = 'http://localhost:3000'

export function useAppUrl(): string {
  const { appUrl } = useRuntimeConfig()

  if (appUrl) {
    return appUrl.replace(/\/$/, '')
  }

  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return LOCAL_APP_URL
}
