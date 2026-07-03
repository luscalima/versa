import { fetch } from 'ofetch'
import { loadEnv } from 'vite'
import { api } from './helpers'
import retry from 'async-retry'
import pg from 'pg'

async function setupDatabase() {
  const TEST_DB_NAME = 'versa_test'
  const env = loadEnv('', process.cwd(), '')

  const client = new pg.Client({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
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

async function waitForAllServices() {
  async function webService() {
    async function fetchStatus() {
      const response = await fetch(api('/api/v1/status'))

      if (response.status !== 200) {
        throw Error()
      }

      await response.json()
    }

    return retry(fetchStatus, {
      retries: 100,
    })
  }

  await webService()
}

export async function setup() {
  await setupDatabase()
  await waitForAllServices()
}
