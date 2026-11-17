import { NativeGeneratorAdapter } from '~~/server/infra/adapters/nativeGeneratorAdapter'
import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { KnexSessionRepository } from '~~/server/infra/repositories/knexSessionRepository'
import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { SessionService } from '~~/server/modules/sessions/sessionService'
import { AnonymousUser } from '~~/server/modules/users/user'
import { UserService } from '~~/server/modules/users/userService'

export default defineEventHandler(async event => {
  event.context.user = new AnonymousUser()

  const sessionId = getCookie(event, 'session_id')

  if (!sessionId) {
    return
  }

  try {
    const db = useDatabase()
    const sessionRepository = new KnexSessionRepository(db)
    const userRepository = new KnexUserRepository(db)
    const hasher = new NativeHasherAdapter()
    const generator = new NativeGeneratorAdapter()
    const sessionService = new SessionService(sessionRepository, userRepository, hasher, generator)
    const userService = new UserService(userRepository, hasher)

    const sessionResult = await sessionService.getValid(sessionId)

    if (sessionResult.isErr()) {
      return
    }

    const userResult = await userService.getById(sessionResult.value.userId)

    if (userResult.isErr()) {
      return
    }

    event.context.user = userResult.value
  } catch {
    event.context.user = new AnonymousUser()
  }
})
