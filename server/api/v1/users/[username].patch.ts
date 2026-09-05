import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { useValidate } from '~~/server/utils/useValidate'
import { UserService } from '~~/server/modules/users/userService'
import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { z } from 'zod'

export const userSchema = z.object({
  username: z.string().trim().nonempty().optional(),
  email: z.string().trim().email().optional(),
  password: z.string().trim().nonempty().min(8).optional(),
})

export default defineRouteHandler(async event => {
  const username = getRouterParam(event, 'username')!
  const repository = new KnexUserRepository(useDatabase())
  const hasher = new NativeHasherAdapter()
  const service = new UserService(repository, hasher)
  const payload = await useValidate(event, userSchema, 'User update validation failed.')

  if (payload.isErr()) {
    return payload.error
  }

  const result = await service.update(username, payload.value)

  if (result.isErr()) {
    return result.error
  }

  setResponseStatus(event, 200)

  return result.value
})
