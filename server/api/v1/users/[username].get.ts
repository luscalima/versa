import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { serializeUserForRequester } from '~~/server/modules/serialization/user'
import { UserService } from '~~/server/modules/users/userService'
import { validateResponse } from '~~/server/utils/validateResponse'

export default defineRouteHandler(async event => {
  const username = getRouterParam(event, 'username')!
  const repository = new KnexUserRepository(useDatabase())
  const hasher = new NativeHasherAdapter()
  const service = new UserService(repository, hasher)

  const result = await service.getByUsername(username)

  if (result.isErr()) {
    return result.error
  }

  const { schema, data } = serializeUserForRequester(result.value, event.context.user)

  setResponseStatus(event, 200)

  return validateResponse(schema, data)
})
