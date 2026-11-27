import { KnexDatabaseRepository } from '~~/server/infra/repositories/knexDatabaseRepository'
import { Permissions } from '~~/server/modules/authorization/permissions'
import { DatabaseService } from '~~/server/modules/database/databaseService'
import {
  migrationListSchema,
  serializeMigrationList,
  type MigrationListResponse,
} from '~~/server/modules/serialization/migration'
import { validateResponse } from '~~/server/utils/validateResponse'

export type GetMigrationsResponse = MigrationListResponse

export default defineRouteHandler(requirePermissions([Permissions.READ_MIGRATION]), async () => {
  const repository = new KnexDatabaseRepository(useDatabase())
  const service = new DatabaseService(repository)
  const result = await service.listMigrations()

  if (result.isErr()) {
    return result.error
  }

  return validateResponse(migrationListSchema, serializeMigrationList(result.value))
})
