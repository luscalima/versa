import { z } from 'zod'
import type { ActivationToken } from '../activation/activationToken'

export const activationTokenSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    usedAt: z.string().datetime().nullable(),
    expiresAt: z.string().datetime(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  })
  .strict()

export type ActivationTokenResponse = z.infer<typeof activationTokenSchema>

export function serializeActivationToken(token: ActivationToken): ActivationTokenResponse {
  return {
    id: token.id,
    userId: token.userId,
    usedAt: token.usedAt?.toISOString() ?? null,
    expiresAt: token.expiresAt.toISOString(),
    ...(token.createdAt ? { createdAt: token.createdAt.toISOString() } : {}),
    ...(token.updatedAt ? { updatedAt: token.updatedAt.toISOString() } : {}),
  }
}
