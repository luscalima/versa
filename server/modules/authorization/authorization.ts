import { err, ok, type Result } from 'neverthrow'
import type { AppError } from '~~/server/utils/errors'
import { forbiddenError, unauthorizedError } from '~~/server/utils/errors'
import type { UserContext } from '../users/user'
import type { Permissions } from './permissions'
import type { PermissionContext, SharedResource } from './policies'
import { Policies } from './policies'

export type AuthorizationMode = 'all' | 'any'

type PermissionCheck<P extends Permissions = Permissions> = {
  permission: P
  context?: PermissionContext<P>
}

type Policy = (context: PermissionContext<Permissions>) => boolean

export function hasPermission(user: UserContext, permission: Permissions): boolean {
  return user.permissions.includes(permission)
}

export function hasPermissions(
  user: UserContext,
  permissions: readonly Permissions[],
  mode: AuthorizationMode = 'all',
): boolean {
  if (permissions.length === 0) {
    return true
  }

  return mode === 'all'
    ? permissions.every(permission => hasPermission(user, permission))
    : permissions.some(permission => hasPermission(user, permission))
}

function authorizationError(user: UserContext, missing: Permissions[]): AppError {
  if (user.isAnonymous) {
    return unauthorizedError({
      message: 'Session is invalid or has expired',
    })
  }

  return forbiddenError({
    message: 'You do not have permission to perform this action',
    data: {
      missing,
    },
  })
}

function evaluate(
  user: UserContext,
  checks: readonly PermissionCheck[],
  mode: AuthorizationMode,
): Result<UserContext, AppError> {
  if (checks.length === 0) {
    return ok(user)
  }

  const evaluations = checks.map(check => {
    if (!hasPermission(user, check.permission)) {
      return { permission: check.permission, allowed: false }
    }

    if (!check.context) {
      return { permission: check.permission, allowed: true }
    }

    const policy = Policies[check.permission] as Policy | undefined

    if (!policy) {
      return { permission: check.permission, allowed: true }
    }

    return {
      permission: check.permission,
      allowed: policy(check.context as PermissionContext<Permissions>),
    }
  })

  const isAllowed =
    mode === 'all'
      ? evaluations.every(evaluation => evaluation.allowed)
      : evaluations.some(evaluation => evaluation.allowed)

  if (isAllowed) {
    return ok(user)
  }

  return err(
    authorizationError(
      user,
      evaluations
        .filter(evaluation => !evaluation.allowed)
        .map(evaluation => evaluation.permission),
    ),
  )
}

export function can<P extends Permissions>(
  permission: P,
  context: { subject: UserContext; resource?: PermissionContext<P>['resource'] },
  mode?: AuthorizationMode,
): Result<boolean, AppError>
export function can<Ps extends readonly Permissions[]>(
  permissions: Ps,
  context: { subject: UserContext; resource?: SharedResource<Ps> },
  mode?: AuthorizationMode,
): Result<boolean, AppError>
export function can(
  permissions: Permissions | readonly Permissions[],
  context: { subject: UserContext; resource?: unknown },
  mode: AuthorizationMode = 'all',
): Result<boolean, AppError> {
  const list = (Array.isArray(permissions) ? permissions : [permissions]) as readonly Permissions[]
  const hasResource = context.resource !== undefined

  const result = evaluate(
    context.subject,
    list.map(permission => ({
      permission,
      context: hasResource ? (context as PermissionContext<Permissions>) : undefined,
    })),
    mode,
  )

  return result.map(() => true)
}
