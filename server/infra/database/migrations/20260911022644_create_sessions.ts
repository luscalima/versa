import type { Knex } from 'knex'

const TABLE = 'sessions'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE, table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('token', 96).notNullable().unique()
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table.timestamp('expires_at').notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE)
}
