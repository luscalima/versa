import { join } from 'node:path'
import type { Knex } from 'knex'
import { snakeCase, toCamelCaseKeys } from 'es-toolkit'

const isTest = process.env.APP_ENV === 'test'

const bypassIdentifiers = ['*']

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: isTest ? process.env.DB_NAME_TEST : process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  },
  migrations: {
    directory: join(process.cwd(), 'server/infra/database/migrations'),
    extension: 'ts',
  },
  wrapIdentifier(value, origImpl) {
    const newValue = bypassIdentifiers.includes(value) ? value : snakeCase(value)
    return origImpl(newValue)
  },
  postProcessResponse(result) {
    return toCamelCaseKeys(result)
  },
}

export default config
