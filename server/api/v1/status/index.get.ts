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

export default defineRouteHandler(async () => {
  const repository = new KnexDatabaseRepository(useDatabase())
  const service = new DatabaseService(repository)
  const result = await service.getStatus()

  if (result.isErr()) {
    return result.error
  }

  const { version, maxConnections, openedConnections } = result.value

  return {
    updatedAt: new Date().toISOString(),
    database: {
      version,
      maxConnections,
      openedConnections,
    },
  }
})
