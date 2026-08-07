import type { Knex } from 'knex'

export type DatabaseStatus = {
  version: string
  maxConnections: number
  openedConnections: number
}

type DatabaseStatusConfig = {
  databaseName: string
}

export function createDatabaseStatus(db: Knex, config: DatabaseStatusConfig) {
  async function get(): Promise<DatabaseStatus> {
    const [version, maxConnections, openedConnections] = await Promise.all([
      db.raw<{ rows: [{ server_version: string }] }>('SHOW server_version;'),
      db.raw<{ rows: [{ max_connections: string }] }>('SHOW max_connections;'),
      db('pg_stat_activity').select('*').where('datname', config.databaseName),
    ])

    return {
      version: version.rows[0].server_version,
      maxConnections: parseInt(maxConnections.rows[0].max_connections),
      openedConnections: openedConnections.length,
    }
  }

  return { get }
}
