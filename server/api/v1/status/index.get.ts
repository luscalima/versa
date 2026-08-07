export type GetStatusResponse = {
  updated_at: string
  database: {
    version: string
    max_connections: number
    opened_connections: number
  }
}

export default defineRouteHandler(async (): Promise<GetStatusResponse> => {
  const databaseStatus = useDatabaseStatus()
  const { version, maxConnections, openedConnections } = await databaseStatus.get()

  return {
    updated_at: new Date().toISOString(),
    database: {
      version,
      max_connections: maxConnections,
      opened_connections: openedConnections,
    },
  }
})
