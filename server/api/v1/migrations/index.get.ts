import { KnexDatabaseRepository } from '~~/server/infra/repositories/knexDatabaseRepository'
import { DatabaseService } from '~~/server/modules/database/databaseService'

export type GetMigrationsResponse = {
  completed: string[]
  pending: string[]
}

export default defineRouteHandler(async (): Promise<GetMigrationsResponse> => {
  const repository = new KnexDatabaseRepository(useDatabase())
  const service = new DatabaseService(repository)

  return await service.listMigrations()
})
