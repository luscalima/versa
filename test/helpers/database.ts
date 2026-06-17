import knex, { type Knex } from 'knex'
import { loadEnv } from 'vite'
import knexBaseConfig from '../../knexfile'
import { TEST_DB_NAME } from '../globalSetup'

let db: Knex | null = null

function getDatabase(): Knex {
  if (!db) {
    const env = loadEnv('', process.cwd(), '')

    db = knex({
      ...knexBaseConfig,
      connection: {
        host: env.DB_HOST ?? 'localhost',
        port: Number(env.DB_PORT ?? 5432),
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: TEST_DB_NAME,
        ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
      },
    })
  }

  return db
}

export async function clearDatabase(): Promise<void> {
  await getDatabase().migrate.rollback(undefined, true)
}

export async function destroyDatabase(): Promise<void> {
  if (db) {
    await db.destroy()
    db = null
  }
}
