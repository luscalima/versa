import { KnexDatabaseRepository } from '~~/server/infra/repositories/knexDatabaseRepository'
import { DatabaseService } from '~~/server/modules/database/databaseService'

export type GetStatusResponse = {
  updatedAt: string
  database: {
    version: string
    maxConnections: number
    openedConnections: number
  }
}

export default defineRouteHandler(async (): Promise<GetStatusResponse> => {
  const repository = new KnexDatabaseRepository(useDatabase())
  const service = new DatabaseService(repository)
  const { version, maxConnections, openedConnections } = await service.getStatus()

  return {
    updatedAt: new Date().toISOString(),
    database: {
      version,
      maxConnections,
      openedConnections,
    },
  }
})
