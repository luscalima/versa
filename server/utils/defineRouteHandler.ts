import type { H3Event } from '#imports'
import { toAppError } from './errors'

export type RouteErrorResponse = {
  statusCode: number
  statusMessage?: string
  message: string
  data?: unknown
}

export type RouteResult<T = unknown> = T | RouteErrorResponse
export type Next<T = unknown> = () => Promise<RouteResult<T>>
export type RouteHandler<T = unknown> = (
  event: H3Event,
  next: Next<T>,
) => RouteResult<T> | Promise<RouteResult<T>>

class NextCalledMoreThanOnceError extends Error {
  constructor() {
    super('next() called more than once')
  }
}

function handleRouteError(event: H3Event, error: unknown): RouteErrorResponse {
  const appError = toAppError(error)

  setResponseStatus(event, appError.statusCode, appError.statusMessage)

  if (appError.statusCode === 401) {
    setCookie(event, 'session_id', '', {
      httpOnly: true,
      path: '/',
      maxAge: -1,
      secure: import.meta.env.NODE_ENV === 'production',
    })
  }

  return {
    statusCode: appError.statusCode,
    statusMessage: appError.statusMessage,
    message: appError.message,
    data: appError.data,
  }
}

async function runStep(
  event: H3Event,
  step: () => RouteResult | Promise<RouteResult>,
): Promise<RouteResult> {
  try {
    const result = await step()

    if (result instanceof Error) {
      throw result
    }

    return result
  } catch (error) {
    if (error instanceof NextCalledMoreThanOnceError) {
      throw error
    }

    return handleRouteError(event, error)
  }
}

export default function defineRouteHandler(
  ...handlers: RouteHandler[]
): ReturnType<typeof defineEventHandler> {
  return defineEventHandler(event => {
    async function dispatch(index = 0): Promise<RouteResult> {
      const handler = handlers[index]

      if (!handler) {
        return undefined
      }

      let nextCalled = false

      const next: Next = async () => {
        if (nextCalled) {
          throw new NextCalledMoreThanOnceError()
        }

        nextCalled = true
        return dispatch(index + 1)
      }

      return runStep(event, () => handler(event, next))
    }

    return dispatch()
  })
}
