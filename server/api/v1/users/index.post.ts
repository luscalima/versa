import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { z } from 'zod'
import { useValidateBody } from '~~/server/utils/useValidateBody'
import { UserService } from '~~/server/modules/users/userService'
import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { ActivationService } from '~~/server/modules/activation/activationService'
import { NodemailerMailAdapter } from '~~/server/infra/adapters/nodemailerMailAdapter'
import { KnexActivationRepository } from '~~/server/infra/repositories/knexActivationRepository'
import { can } from '~~/server/modules/authorization/authorization'
import { Permissions } from '~~/server/modules/authorization/permissions'
import type { User } from '~~/server/modules/users/user'

export const userSchema = z.object({
  username: z.string().nonempty().trim(),
  email: z.string().email().trim(),
  password: z.string().nonempty().trim().min(8),
  permissions: z.array(z.nativeEnum(Permissions)).optional(),
})

export default defineRouteHandler(async event => {
  const authorizationResult = can(Permissions.CREATE_USER, {
    subject: event.context.user,
    resource: event.context.user as unknown as User,
  })

  if (authorizationResult.isErr()) {
    return authorizationResult.error
  }

  const payload = await useValidateBody(event, userSchema, 'User creation validation failed.')

  if (payload.isErr()) {
    return payload.error
  }

  const runtimeConfig = useRuntimeConfig()
  const db = useDatabase()
  const hasher = new NativeHasherAdapter()
  const mailer = new NodemailerMailAdapter(runtimeConfig.mail)
  const userRepository = new KnexUserRepository(db)
  const userService = new UserService(userRepository, hasher)
  const activationRepository = new KnexActivationRepository(db)
  const activationService = new ActivationService(activationRepository, mailer)
  const userResult = await userService.create(payload.value)

  if (userResult.isErr()) {
    return userResult.error
  }

  const activationResult = await activationService.create(userResult.value)

  if (activationResult.isErr()) {
    return activationResult.error
  }

  await activationService.sendNewUserEmail(userResult.value, activationResult.value)

  setResponseStatus(event, 201)

  return userResult.value.toDTO()
})
