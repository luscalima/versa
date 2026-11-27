import type { Knex } from 'knex'

const table = 'users'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(table, table => {
    table.specificType('resources', 'text[]').notNullable().defaultTo(knex.raw("'{}'::text[]"))
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(table, table => {
    table.dropColumn('resources')
  })
}
