import { err, ok, type Result } from 'neverthrow'
import type { AppError } from '~~/server/utils/errors'
import { forbiddenError, unauthorizedError } from '~~/server/utils/errors'
import type { UserContext } from '../users/user'
import type { Resource } from './resources'

export type AuthorizationMode = 'all' | 'any'

export function hasResource(user: UserContext, resource: Resource): boolean {
  return user.resources.includes(resource)
}

export function hasResources(
  user: UserContext,
  resources: readonly Resource[],
  mode: AuthorizationMode = 'all',
): boolean {
  if (resources.length === 0) {
    return true
  }

  return mode === 'all'
    ? resources.every(resource => hasResource(user, resource))
    : resources.some(resource => hasResource(user, resource))
}

export function authorize(
  user: UserContext,
  resources: readonly Resource[],
  mode: AuthorizationMode = 'all',
): Result<UserContext, AppError> {
  if (user.isAnonymous) {
    return err(
      unauthorizedError({
        message: 'Session is invalid or has expired',
      }),
    )
  }

  if (!hasResources(user, resources, mode)) {
    return err(
      forbiddenError({
        message: 'You do not have permission to perform this action',
        data: {
          missing: resources.filter(resource => !hasResource(user, resource)),
        },
      }),
    )
  }

  return ok(user)
}
