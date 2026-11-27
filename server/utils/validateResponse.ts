import type { z, ZodType } from 'zod'
import { internalServerError } from './errors'

export function validateResponse<T extends ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return result.data
  }

  throw internalServerError({
    message: 'Response validation failed',
    data: { issues: result.error.issues },
  })
}
