import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { z } from 'zod'
import { useValidateBody } from '~~/server/utils/useValidateBody'
import { UserService } from '~~/server/modules/users/userService'
import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { ActivationService } from '~~/server/modules/activation/activationService'
import { NodemailerMailAdapter } from '~~/server/infra/adapters/nodemailerMailAdapter'
import { KnexActivationRepository } from '~~/server/infra/repositories/knexActivationRepository'
import { Resource } from '~~/server/modules/authorization/resources'

export const userSchema = z.object({
  username: z.string().nonempty().trim(),
  email: z.string().email().trim(),
  password: z.string().nonempty().trim().min(8),
  resources: z.array(z.nativeEnum(Resource)).optional(),
})

export default defineRouteHandler(async event => {
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
