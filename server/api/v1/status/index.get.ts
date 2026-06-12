export type GetStatusResponse = {
  updated_at: string
  database: {
    version: string
    max_connections: number
    opened_connections: number
  }
}

export default defineEventHandler(async (): Promise<GetStatusResponse> => {
  const db = useDatabase()
  const dbName = useRuntimeConfig().database.name

  const [version, maxConnections, openedConnections] = await Promise.all([
    db.raw<{ rows: [{ server_version: string }] }>("SHOW server_version;"),
    db.raw<{ rows: [{ max_connections: string }] }>("SHOW max_connections;"),
    db('pg_stat_activity').select('*').where('datname', dbName)
  ])

  return {
    updated_at: new Date().toISOString(),
    database: {
      version: version.rows[0].server_version,
      max_connections: parseInt(maxConnections.rows[0].max_connections),
      opened_connections: openedConnections.length,
    }
  }
})
