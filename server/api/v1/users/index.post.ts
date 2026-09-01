import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { z } from 'zod'
import { useValidate } from '~~/server/utils/useValidate'
import { User } from '~~/server/modules/users/user'
import { unprocessableEntityError } from '~~/server/utils/errors'
import { UserService } from '~~/server/modules/users/userService'

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

  const user = User.create(payload.value)

  if (user.isErr()) {
    return unprocessableEntityError({
      message: user.error,
    })
  }

  const repository = new KnexUserRepository()
  const service = new UserService(repository)
  const result = await service.create(user.value)

  if (result.isErr()) {
    return result.error
  }

  setResponseStatus(event, 201)

  return result.value
})
