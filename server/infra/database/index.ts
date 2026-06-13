import knex, { type Knex } from 'knex'
import knexConfig from '../../../knexfile'

export type Database = Knex

export function createDatabase(): Database {
  return knex(knexConfig)
}
