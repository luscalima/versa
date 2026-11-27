import { KnexDatabaseRepository } from '~~/server/infra/repositories/knexDatabaseRepository'
import { DatabaseService } from '~~/server/modules/database/databaseService'
import {
  type FullStatus,
  serializeStatusForRequester,
  type PublicStatus,
} from '~~/server/modules/serialization/status'
import { validateResponse } from '~~/server/utils/validateResponse'

export type GetStatusResponse = PublicStatus | FullStatus

export default defineRouteHandler(async event => {
  const repository = new KnexDatabaseRepository(useDatabase())
  const service = new DatabaseService(repository)
  const result = await service.getStatus()

  if (result.isErr()) {
    return result.error
  }

  const { schema, data } = serializeStatusForRequester(result.value, event.context.user)

  return validateResponse(schema, data)
})
