import knex, { type Knex } from 'knex'

interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  name: string
}

export type Database = Knex

export function createDatabase(config: DatabaseConfig): Database {
  return knex({
    client: 'pg',
    connection: {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.name,
    },
  })
}
