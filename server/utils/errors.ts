interface AppErrorOptions {
  code?: string
  message?: string
  cause?: Error | unknown
  data?: Record<string, unknown>
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
  return createError(errorOptions(500, 'INTERNAL_SERVER_ERROR', opts))
}
