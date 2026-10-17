import type { H3Error } from '#imports'
import { DatabaseError } from 'pg'

export type AppError = H3Error

type ErrorLike = Error & {
  statusCode?: number
  statusMessage?: string
  data?: unknown
  cause?: unknown
}

// Errors that can't be directly exposed to the client
function isForbiddenService(error: unknown) {
  return [DatabaseError].some(err => error instanceof err)
}

export function toAppError(error: unknown): H3Error {
  if (isError(error)) {
    return error
  }

  if (isForbiddenService(error)) {
    return internalServerError({
      cause: error,
      message: 'The operation could not be completed at this time. Please try again later.',
      statusCode: 503,
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

interface AppErrorOptions {
  code?: string
  message?: string
  cause?: Error | unknown
  data?: Record<string, unknown>
  statusCode?: number
}

function errorOptions(statusCode: number, code: string, opts: AppErrorOptions) {
  return {
    statusCode,
    message: opts.message,
    cause: opts.cause,
    data: {
      ...(opts.data ?? {}),
      code: opts.code ?? code,
    },
  }
}

export function internalServerError(opts: AppErrorOptions) {
  return createError(errorOptions(opts.statusCode ?? 500, 'INTERNAL_SERVER_ERROR', opts))
}

export function methodNotAllowedError(opts: AppErrorOptions) {
  return createError(errorOptions(405, 'METHOD_NOT_ALLOWED', opts))
}

export function badRequestError(opts: AppErrorOptions) {
  return createError(errorOptions(400, 'BAD_REQUEST', opts))
}

export function unprocessableEntityError(opts: AppErrorOptions) {
  return createError(errorOptions(422, 'UNPROCESSABLE_ENTITY', opts))
}

export function conflictError(opts: AppErrorOptions) {
  return createError(errorOptions(409, 'CONFLICT', opts))
}

export function notFoundError(opts: AppErrorOptions) {
  return createError(errorOptions(404, 'NOT_FOUND', opts))
}

export function unauthorizedError(opts: AppErrorOptions) {
  return createError(errorOptions(401, 'UNAUTHORIZED', opts))
}
