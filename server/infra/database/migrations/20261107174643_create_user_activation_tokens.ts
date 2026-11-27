import type { Knex } from 'knex'

const TABLE = 'user_activation_tokens'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE, table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    table.timestamp('used_at')
    table.timestamp('expires_at').notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE)
}
