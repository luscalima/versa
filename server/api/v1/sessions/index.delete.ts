import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { SessionService } from '~~/server/modules/sessions/sessionService'
import { KnexSessionRepository } from '~~/server/infra/repositories/knexSessionRepository'
import { NativeGeneratorAdapter } from '~~/server/infra/adapters/nativeGeneratorAdapter'

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

  const sessionResult = await sessionService.invalidate(sessionId)

  setResponseStatus(event, 204)

  if (sessionResult.isErr()) {
    return sessionResult.error
  }
})
