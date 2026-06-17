import pg from 'pg'
import { loadEnv } from 'vite'

export const TEST_DB_NAME = 'versa_test'

export async function setup() {
  const env = loadEnv('', process.cwd(), '')

  const client = new pg.Client({
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  })

  await client.connect()

  const { rows } = await client.query<{ exists: boolean }>(
    `SELECT 1 as exists FROM pg_database WHERE datname = $1`,
    [TEST_DB_NAME]
  )

  if (rows.length === 0) {
    await client.query(`CREATE DATABASE "${TEST_DB_NAME}"`)
  }

  await client.end()
}
