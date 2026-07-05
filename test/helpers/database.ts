import knex, { type Knex } from 'knex'
import { loadEnv } from 'vite'
import knexBaseConfig from '../../knexfile'
import { createMigrationSource } from '../../server/infra/database/migrations-source'

let db: Knex | null = null

async function getDatabase(): Promise<Knex> {
  if (!db) {
    const env = loadEnv('', process.cwd(), '')

    db = knex({
      ...knexBaseConfig,
      connection: {
        host: env.DB_HOST,
        port: Number(env.DB_PORT),
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME_TEST,
        ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
      },
      migrations: {
        migrationSource: await createMigrationSource(),
      },
    })
  }

  return db
}

export async function clearDatabase(): Promise<void> {
  const db = await getDatabase()
  await db.migrate.rollback(undefined, true)
}

export async function destroyDatabase(): Promise<void> {
  if (db) {
    await db.destroy()
    db = null
  }
}
