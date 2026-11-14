import type { H3Event } from '#imports'
import type { z, ZodType } from 'zod'
import { ok, err } from 'neverthrow'
import { badRequestError } from './errors'

export async function useValidateParams<T extends ZodType>(
  event: H3Event,
  schema: T,
  message: string,
  code = 'BAD_REQUEST',
) {
  const result = schema.safeParse(getRouterParams(event))

  if (result.success) {
    return ok(result.data as z.infer<T>)
  }

  const error = badRequestError({
    code,
    message,
  })

  return err(error)
}
