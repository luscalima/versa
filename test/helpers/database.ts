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

function isMigrationLocked(error: unknown): boolean {
  return error instanceof Error && error.name === 'MigrationLocked'
}

async function withMigrationLockRetry(operation: () => Promise<void>): Promise<void> {
  const db = await getDatabase()

  try {
    await operation()
  } catch (error) {
    if (!isMigrationLocked(error)) throw error

    await db.migrate.forceFreeMigrationsLock()
    await operation()
  }
}

export async function clearDatabase(): Promise<void> {
  const db = await getDatabase()

  await withMigrationLockRetry(() => db.migrate.rollback(undefined, true))
}

export { getDatabase }

export async function destroyDatabase(): Promise<void> {
  if (db) {
    await db.destroy()
    db = null
  }
}

export async function unlockDatabase(): Promise<void> {
  const db = await getDatabase()
  await db.migrate.forceFreeMigrationsLock()
}

export async function restoreDatabase(): Promise<void> {
  const db = await getDatabase()

  await withMigrationLockRetry(() => db.migrate.latest())
}

export async function rebuildDatabase(): Promise<void> {
  await clearDatabase()
  await restoreDatabase()
}

export async function downDatabase() {
  await clearDatabase()
  await destroyDatabase()
}
