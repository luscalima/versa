import type { H3Event } from '#imports'
import { toAppError } from './validators'

export default function defineRouteHandler<T>(handler: (event: H3Event) => Promise<T>) {
  return defineEventHandler(async event => {
    try {
      const result = await handler(event)

      if (result instanceof Error) {
        throw result
      }

      return result
    } catch (error) {
      const appError = toAppError(error)

      setResponseStatus(event, appError.statusCode, appError.statusMessage)

      return {
        status_code: appError.statusCode,
        status_message: appError.statusMessage,
        message: appError.message,
        data: appError.data,
      }
    }
  })
}
