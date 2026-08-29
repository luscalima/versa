import type { Knex } from 'knex'
import type {
  DatabaseStatus,
  MigratorListResult,
  MigratorRunResult,
} from '~~/server/modules/database/database'
import type { DatabaseRepository } from '~~/server/modules/database/databaseRepository'

export class KnexDatabaseRepository implements DatabaseRepository {
  private readonly db: Knex
  private readonly databaseName = useRuntimeConfig().database.name

  constructor(db: Knex) {
    this.db = db
  }

  async getStatus(): Promise<DatabaseStatus> {
    const [version, maxConnections, openedConnections] = await Promise.all([
      this.db.raw<{ rows: [{ server_version: string }] }>('SHOW server_version;'),
      this.db.raw<{ rows: [{ max_connections: string }] }>('SHOW max_connections;'),
      this.db('pg_stat_activity').select('*').where('datname', this.databaseName),
    ])

    return {
      version: version.rows[0].server_version,
      maxConnections: parseInt(maxConnections.rows[0].max_connections),
      openedConnections: openedConnections.length,
    }
  }

  async listMigrations(): Promise<MigratorListResult> {
    const [completed, pending] = await this.db.migrate.list()

    return {
      completed: completed.map((m: { name: string }) => m.name),
      pending: pending.map((m: { name: string }) => m.name),
    }
  }

  async runMigrations(): Promise<MigratorRunResult> {
    const [, completed] = await this.db.migrate.latest()

    return { completed }
  }
}
