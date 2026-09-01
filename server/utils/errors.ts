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
