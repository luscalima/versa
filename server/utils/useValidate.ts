import type { H3Event } from '#imports'
import type { z, ZodType } from 'zod'
import { ok, err } from 'neverthrow'
import { badRequestError } from './errors'

export async function useValidate<T extends ZodType>(event: H3Event, schema: T, message: string) {
  const body = await readBody(event)
  const result = schema.safeParse(body)

  if (result.success) {
    return ok(result.data as z.infer<T>)
  }

  const flattened = result.error.flatten()
  const data = {
    form: flattened.formErrors.join(', '),
    fields: Object.entries(flattened.fieldErrors).reduce(
      (acc, cur) => ({
        [cur[0]]: cur[1]?.at(0) ?? '',
        ...acc,
      }),
      {},
    ),
  }

  if (!data.form) Reflect.deleteProperty(data, 'form')
  if (!Object.keys(data.fields).length) Reflect.deleteProperty(data, 'fields')

  const error = badRequestError({
    message,
    data,
  })

  return err(error)
}
