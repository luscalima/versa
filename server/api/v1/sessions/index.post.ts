import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { useValidateBody } from '~~/server/utils/useValidateBody'
import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { SessionService } from '~~/server/modules/sessions/sessionService'
import { KnexSessionRepository } from '~~/server/infra/repositories/knexSessionRepository'
import { NativeGeneratorAdapter } from '~~/server/infra/adapters/nativeGeneratorAdapter'
import { authorize } from '~~/server/modules/authorization/authorization'
import { Permission } from '~~/server/modules/authorization/permissions'
import { z } from 'zod'

export const sessionSchema = z.object({
  email: z.string().email().trim(),
  password: z.string().nonempty().trim().min(8),
})

export default defineRouteHandler(requirePermissions([Permission.CREATE_SESSIONS]), async event => {
  const payload = await useValidateBody(
    event,
    sessionSchema,
    'User authentication validation failed.',
  )

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

  const authorizationResult = authorize(authResult.value, [Permission.CREATE_SESSIONS])

  if (authorizationResult.isErr()) {
    return authorizationResult.error
  }

  const sessionResult = await sessionService.create(authResult.value.id)

  if (sessionResult.isErr()) {
    return sessionResult.error
  }

  const session = sessionResult.value.toDTO()

  setResponseStatus(event, 201)
  setCookie(event, 'session_id', session.token, {
    httpOnly: true,
    path: '/',
    maxAge: SessionService.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: import.meta.env.NODE_ENV === 'production',
  })

  return session
})
