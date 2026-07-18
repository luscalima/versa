import { type H3Error, isError as isH3Error } from '#imports'
import { DatabaseError } from 'pg'

type ErrorLike = Error & {
  statusCode?: number
  statusMessage?: string
  data?: unknown
  cause?: unknown
}

function isForbidden(error: unknown) {
  return [DatabaseError].some(err => error instanceof err)
}

export function toAppError(error: unknown): H3Error {
  if (isH3Error(error)) {
    return error
  }

  if (isForbidden(error)) {
    return internalServerError({
      cause: error,
      message: 'The operation could not be completed at this time. Please try again later.',
    })
  }

  if (error instanceof Error) {
    const err: ErrorLike = error

    return createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Internal Server Error',
      message: err.message,
      data: err.data,
      cause: err.cause ?? err,
    })
  }

  return internalServerError({
    cause: error,
    message: 'Unknown Error',
  })
}
