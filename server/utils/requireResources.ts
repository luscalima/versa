import type { H3Event } from '#imports'
import type { AuthorizationMode } from '~~/server/modules/authorization/authorization'
import { authorize } from '~~/server/modules/authorization/authorization'
import type { Resource } from '~~/server/modules/authorization/resources'
import type { RouteHandler } from './defineRouteHandler'

export function requireResources(
  resources: readonly Resource[],
  mode: AuthorizationMode = 'all',
): RouteHandler {
  return (event: H3Event, next) => {
    const result = authorize(event.context.user, resources, mode)

    return result.isErr() ? result.error : next()
  }
}
