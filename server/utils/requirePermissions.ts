import type { H3Event } from '#imports'
import type { AuthorizationMode } from '~~/server/modules/authorization/authorization'
import { can } from '~~/server/modules/authorization/authorization'
import type { Permissions } from '~~/server/modules/authorization/permissions'
import type { RouteHandler } from './defineRouteHandler'

export function requirePermissions(
  permissions: readonly Permissions[],
  mode: AuthorizationMode = 'all',
): RouteHandler {
  return (event: H3Event, next) => {
    const result = can(permissions, { subject: event.context.user }, mode)

    return result.isErr() ? result.error : next()
  }
}
