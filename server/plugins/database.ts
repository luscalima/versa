import { createDatabase, type Database } from '../infra/database/database'
import { createMigrationSource } from '../infra/database/migrations-source'
declare module 'nitropack' {
  interface NitroApp {
    database: Database
  }
}

export default defineNitroPlugin(async (nitroApp) => {
  const migrationSource = await createMigrationSource()
  const database = createDatabase({ migrationSource })

  nitroApp.database = database

  nitroApp.hooks.hookOnce('close', async () => {
    await database.destroy()
  })
})
