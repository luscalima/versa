import { KnexDatabaseRepository } from '~~/server/infra/repositories/knexDatabaseRepository'
import { DatabaseService } from '~~/server/modules/database/databaseService'

export default defineRouteHandler(async event => {
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
