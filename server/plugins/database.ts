import { createDatabase, type Database } from '../infra/database'

declare module 'nitropack' {
  interface NitroApp {
    database: Database
  }
}

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  const database = createDatabase(config.database)

  nitroApp.database = database

  nitroApp.hooks.hookOnce('close', async () => {
    await database.destroy()
  })
})
