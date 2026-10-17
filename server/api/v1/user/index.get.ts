import { NativeGeneratorAdapter } from '~~/server/infra/adapters/nativeGeneratorAdapter'
import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { KnexSessionRepository } from '~~/server/infra/repositories/knexSessionRepository'
import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { SessionService } from '~~/server/modules/sessions/sessionService'
import { UserService } from '~~/server/modules/users/userService'
import { unauthorizedError } from '~~/server/utils/errors'

export default defineRouteHandler(async event => {
  const sessionId = getCookie(event, 'session_id')

  if (!sessionId) {
    return unauthorizedError({
      code: 'UNAUTHORIZED',
      message: 'Session is invalid or has expired',
    })
  }

  const sessionRepository = new KnexSessionRepository(useDatabase())
  const userRepository = new KnexUserRepository(useDatabase())
  const hasher = new NativeHasherAdapter()
  const generator = new NativeGeneratorAdapter()
  const sessionService = new SessionService(sessionRepository, userRepository, hasher, generator)
  const userService = new UserService(userRepository, hasher)
  const sessionResult = await sessionService.getValid(sessionId)

  if (sessionResult.isErr()) {
    return sessionResult.error
  }

  const userResult = await userService.getById(sessionResult.value.userId)

  if (userResult.isErr()) {
    return userResult.error
  }

  const user = userResult.value

  return {
    id: user.id,
    username: user.username,
    email: user.email,
  }
})
