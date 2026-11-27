import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { hasPermission } from '~~/server/modules/authorization/authorization'
import { Permissions } from '~~/server/modules/authorization/permissions'
import { UserService } from '~~/server/modules/users/userService'

export default defineRouteHandler(async event => {
  const username = getRouterParam(event, 'username')!
  const repository = new KnexUserRepository(useDatabase())
  const hasher = new NativeHasherAdapter()
  const service = new UserService(repository, hasher)

  const result = await service.getByUsername(username)

  if (result.isErr()) {
    return result.error
  }

  const requester = event.context.user
  const canReadEmail =
    requester.id === result.value.id || hasPermission(requester, Permissions.READ_USER)

  setResponseStatus(event, 200)

  return {
    username: result.value.username,
    ...(canReadEmail ? { email: result.value.email } : {}),
  }
})
