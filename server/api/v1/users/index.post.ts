import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { z } from 'zod'
import { useValidate } from '~~/server/utils/useValidate'
import { UserService } from '~~/server/modules/users/userService'
import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'

export const userSchema = z.object({
  username: z.string().nonempty().trim(),
  email: z.string().email().trim(),
  password: z.string().nonempty().trim().min(8),
})

export default defineRouteHandler(async event => {
  const payload = await useValidate(event, userSchema, 'User creation validation failed.')

  if (payload.isErr()) {
    return payload.error
  }

  const repository = new KnexUserRepository(useDatabase())
  const hasher = new NativeHasherAdapter()
  const service = new UserService(repository, hasher)
  const result = await service.create(payload.value)

  if (result.isErr()) {
    return result.error
  }

  setResponseStatus(event, 201)

  return result.value
})
