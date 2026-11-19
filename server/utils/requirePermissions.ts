import type { H3Event } from '#imports'
import type { AuthorizationMode } from '~~/server/modules/authorization/authorization'
import { authorize } from '~~/server/modules/authorization/authorization'
import type { Permission } from '~~/server/modules/authorization/permissions'
import type { RouteHandler } from './defineRouteHandler'

export function requirePermissions(
  permissions: readonly Permission[],
  mode: AuthorizationMode = 'all',
): RouteHandler {
  return (event: H3Event, next) => {
    const result = authorize(event.context.user, permissions, mode)

    return result.isErr() ? result.error : next()
  }
}
