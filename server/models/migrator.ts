import type { Knex } from 'knex'

export type MigratorListResult = {
  completed: string[]
  pending: string[]
}

export type MigratorRunResult = {
  completed: string[]
}

export type Migrator = {
  list: () => Promise<MigratorListResult>
  run: () => Promise<MigratorRunResult>
}

export function createMigrator(db: Knex): Migrator {
  async function list(): Promise<MigratorListResult> {
    const [completed, pending] = await db.migrate.list()

    return {
      completed: completed.map((m: { name: string }) => m.name),
      pending: pending.map((m: { name: string }) => m.name),
    }
  }

  async function run(): Promise<MigratorRunResult> {
    const [, completed] = await db.migrate.latest()

    return { completed }
  }

  return { list, run }
}
