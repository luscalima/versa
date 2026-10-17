import { KnexDatabaseRepository } from '~~/server/infra/repositories/knexDatabaseRepository'
import { DatabaseService } from '~~/server/modules/database/databaseService'

export type GetMigrationsResponse = {
  completed: string[]
  pending: string[]
}

export default defineRouteHandler(async () => {
  const repository = new KnexDatabaseRepository(useDatabase())
  const service = new DatabaseService(repository)
  const result = await service.listMigrations()

  if (result.isErr()) {
    return result.error
  }

  return result.value
})
