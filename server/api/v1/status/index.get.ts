import { KnexDatabaseRepository } from '~~/server/infra/repositories/knexDatabaseRepository'
import { hasPermission } from '~~/server/modules/authorization/authorization'
import { Permissions } from '~~/server/modules/authorization/permissions'
import { DatabaseService } from '~~/server/modules/database/databaseService'

export type GetStatusResponse = {
  updatedAt: string
  database: {
    version?: string
    maxConnections: number
    openedConnections: number
  }
}

export default defineRouteHandler(requirePermissions([Permissions.READ_STATUS]), async event => {
  const repository = new KnexDatabaseRepository(useDatabase())
  const service = new DatabaseService(repository)
  const result = await service.getStatus()

  if (result.isErr()) {
    return result.error
  }

  const { version, maxConnections, openedConnections } = result.value
  const canReadHiddenFields = hasPermission(
    event.context.user,
    Permissions.READ_STATUS_HIDDEN_FIELDS,
  )

  return {
    updatedAt: new Date().toISOString(),
    database: {
      ...(canReadHiddenFields ? { version } : {}),
      maxConnections,
      openedConnections,
    },
  }
})
