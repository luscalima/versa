import { KnexDatabaseRepository } from '~~/server/infra/repositories/knexDatabaseRepository'
import { DatabaseService } from '~~/server/modules/database/databaseService'

export type GetStatusResponse = {
  updated_at: string
  database: {
    version: string
    max_connections: number
    opened_connections: number
  }
}

export default defineRouteHandler(async (): Promise<GetStatusResponse> => {
  const repository = new KnexDatabaseRepository(useDatabase())
  const service = new DatabaseService(repository)
  const { version, maxConnections, openedConnections } = await service.getStatus()

  return {
    updated_at: new Date().toISOString(),
    database: {
      version,
      max_connections: maxConnections,
      opened_connections: openedConnections,
    },
  }
})
