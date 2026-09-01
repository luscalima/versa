import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { UserService } from '~~/server/modules/users/userService'

export default defineRouteHandler(async event => {
  const username = getRouterParam(event, 'username')!
  const repository = new KnexUserRepository()
  const service = new UserService(repository)

  const result = await service.findByUsername(username)

  if (result.isErr()) {
    return result.error
  }

  setResponseStatus(event, 200)

  return {
    username: result.value.username,
    email: result.value.email,
    password: result.value.password,
  }
})
