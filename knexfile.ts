import type { Knex } from 'knex'

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: true }
      : false,
  },
  migrations: {
    directory: './server/infra/database/migrations',
    extension: 'ts',
  },
}

export default config
