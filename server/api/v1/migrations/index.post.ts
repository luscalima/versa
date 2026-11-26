import { KnexDatabaseRepository } from '~~/server/infra/repositories/knexDatabaseRepository'
import { Permissions } from '~~/server/modules/authorization/permissions'
import { DatabaseService } from '~~/server/modules/database/databaseService'

export default defineRouteHandler(requirePermissions([Permissions.RUN_MIGRATION]), async event => {
  const repository = new KnexDatabaseRepository(useDatabase())
  const service = new DatabaseService(repository)
  const result = await service.runMigrations()

  if (result.isErr()) {
    return result.error
  }

  const { completed } = result.value

  setResponseStatus(event, completed.length > 0 ? 201 : 200)

  return {
    completed,
  }
})
