import { z } from 'zod'
import { hasPermission } from '../authorization/authorization'
import { Permissions } from '../authorization/permissions'
import type { User, UserContext } from '../users/user'

export const publicUserSchema = z
  .object({
    username: z.string(),
  })
  .strict()

export type PublicUser = z.infer<typeof publicUserSchema>

export const contactUserSchema = z
  .object({
    username: z.string(),
    email: z.string().email(),
  })
  .strict()

export type ContactUser = z.infer<typeof contactUserSchema>

export const fullUserSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    email: z.string().email(),
    permissions: z.array(z.nativeEnum(Permissions)),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  })
  .strict()

export type FullUser = z.infer<typeof fullUserSchema>

export function serializePublicUser(user: User): PublicUser {
  return {
    username: user.username,
  }
}

export function serializeContactUser(user: User): ContactUser {
  return {
    username: user.username,
    email: user.email,
  }
}

export function serializeFullUser(user: User): FullUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    permissions: user.permissions,
    ...(user.createdAt ? { createdAt: user.createdAt.toISOString() } : {}),
    ...(user.updatedAt ? { updatedAt: user.updatedAt.toISOString() } : {}),
  }
}

export function serializeUserForRequester(user: User, requester: UserContext) {
  const canReadEmail = requester.id === user.id || hasPermission(requester, Permissions.READ_USER)

  return canReadEmail
    ? { schema: contactUserSchema, data: serializeContactUser(user) }
    : { schema: publicUserSchema, data: serializePublicUser(user) }
}
