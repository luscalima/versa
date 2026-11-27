import { KnexUserRepository } from '~~/server/infra/repositories/knexUserRepository'
import { useValidateBody } from '~~/server/utils/useValidateBody'
import { UserService } from '~~/server/modules/users/userService'
import { NativeHasherAdapter } from '~~/server/infra/adapters/nativeHasherAdapter'
import { Permissions } from '~~/server/modules/authorization/permissions'
import { can } from '~~/server/modules/authorization/authorization'
import { fullUserSchema, serializeFullUser } from '~~/server/modules/serialization/user'
import { validateResponse } from '~~/server/utils/validateResponse'
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
  const payload = await useValidateBody(event, userSchema, 'User update validation failed.')

  if (payload.isErr()) {
    return payload.error
  }

  const targetUser = await service.getByUsername(username)

  if (targetUser.isErr()) {
    return targetUser.error
  }

  const canResult = can(
    [Permissions.UPDATE_USER, Permissions.UPDATE_USER_OTHERS],
    {
      subject: event.context.user,
      resource: targetUser.value,
    },
    'any',
  )

  if (canResult.isErr()) {
    return canResult.error
  }

  const result = await service.update(username, payload.value)

  if (result.isErr()) {
    return result.error
  }

  setResponseStatus(event, 200)

  return validateResponse(fullUserSchema, serializeFullUser(result.value))
})
