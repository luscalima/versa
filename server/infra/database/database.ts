import knex, { type Knex } from 'knex'
import knexConfig from '~~/knexfile'

export type Database = Knex

interface DatabaseConfig {
  migrationSource: Knex.MigratorConfig['migrationSource']
}

export function createDatabase(config?: DatabaseConfig): Database {
  return knex({
    ...knexConfig,
    migrations: config?.migrationSource ?
      { migrationSource: config.migrationSource } :
      knexConfig.migrations,
  })
}
