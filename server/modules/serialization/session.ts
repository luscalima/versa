import { z } from 'zod'
import type { Session } from '../sessions/session'

export const sessionResponseSchema = z
  .object({
    id: z.string(),
    token: z.string(),
    userId: z.string(),
    expiresAt: z.string().datetime(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  })
  .strict()

export type SessionResponse = z.infer<typeof sessionResponseSchema>

export function serializeSession(session: Session): SessionResponse {
  return {
    id: session.id,
    token: session.token,
    userId: session.userId,
    expiresAt: session.expiresAt.toISOString(),
    ...(session.createdAt ? { createdAt: session.createdAt.toISOString() } : {}),
    ...(session.updatedAt ? { updatedAt: session.updatedAt.toISOString() } : {}),
  }
}
