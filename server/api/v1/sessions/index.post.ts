import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { useValidate } from '~~/server/utils/useValidate'
import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { SessionService } from '~~/server/modules/sessions/sessionService'
import { KnexSessionRepository } from '~~/server/infra/repositories/knexSessionRepository'
import { NativeGeneratorAdapter } from '~~/server/infra/adapters/nativeGeneratorAdapter'
import { z } from 'zod'

export const sessionSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().nonempty().trim().min(8),
})

export default defineRouteHandler(async event => {
  const payload = await useValidate(event, sessionSchema, 'User authentication validation failed.')

  if (payload.isErr()) {
    return payload.error
  }

  const sessionRepository = new KnexSessionRepository(useDatabase())
  const userRepository = new KnexUserRepository(useDatabase())
  const hasher = new NativeHasherAdapter()
  const generator = new NativeGeneratorAdapter()
  const sessionService = new SessionService(sessionRepository, userRepository, hasher, generator)
  const authResult = await sessionService.authenticate(payload.value.email, payload.value.password)

  if (authResult.isErr()) {
    return authResult.error
  }

  const sessionResult = await sessionService.create(authResult.value.id)

  setResponseStatus(event, 201)
  setCookie(event, 'session_id', (sessionResult as { token: string }).token, {
    httpOnly: true,
    path: '/',
    maxAge: SessionService.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: import.meta.env.NODE_ENV === 'production',
  })

  return sessionResult
})
