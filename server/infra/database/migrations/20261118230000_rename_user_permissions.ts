import type { Knex } from 'knex'

const table = 'users'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(table, table => {
    table.renameColumn('resources', 'permissions')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(table, table => {
    table.renameColumn('permissions', 'resources')
  })
}
