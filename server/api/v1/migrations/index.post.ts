import { KnexDatabaseRepository } from '~~/server/infra/repositories/knexDatabaseRepository'
import { Permissions } from '~~/server/modules/authorization/permissions'
import { DatabaseService } from '~~/server/modules/database/databaseService'
import {
  migrationRunSchema,
  serializeMigrationRun,
} from '~~/server/modules/serialization/migration'
import { validateResponse } from '~~/server/utils/validateResponse'

export default defineRouteHandler(requirePermissions([Permissions.RUN_MIGRATION]), async event => {
  const repository = new KnexDatabaseRepository(useDatabase())
  const service = new DatabaseService(repository)
  const result = await service.runMigrations()

  if (result.isErr()) {
    return result.error
  }

  const response = validateResponse(migrationRunSchema, serializeMigrationRun(result.value))

  setResponseStatus(event, response.completed.length > 0 ? 201 : 200)

  return response
})
