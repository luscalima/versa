import { err, ok, type Result } from 'neverthrow'
import type { AppError } from '~~/server/utils/errors'
import { forbiddenError, unauthorizedError } from '~~/server/utils/errors'
import type { UserContext } from '../users/user'
import type { Permission } from './permissions'

export type AuthorizationMode = 'all' | 'any'

export function hasPermission(user: UserContext, permission: Permission): boolean {
  return user.permissions.includes(permission)
}

export function hasPermissions(
  user: UserContext,
  permissions: readonly Permission[],
  mode: AuthorizationMode = 'all',
): boolean {
  if (permissions.length === 0) {
    return true
  }

  return mode === 'all'
    ? permissions.every(permission => hasPermission(user, permission))
    : permissions.some(permission => hasPermission(user, permission))
}

export function authorize(
  user: UserContext,
  permissions: readonly Permission[],
  mode: AuthorizationMode = 'all',
): Result<UserContext, AppError> {
  if (hasPermissions(user, permissions, mode)) {
    return ok(user)
  }

  if (user.isAnonymous) {
    return err(
      unauthorizedError({
        message: 'Session is invalid or has expired',
      }),
    )
  }

  return err(
    forbiddenError({
      message: 'You do not have permission to perform this action',
      data: {
        missing: permissions.filter(permission => !hasPermission(user, permission)),
      },
    }),
  )
}
