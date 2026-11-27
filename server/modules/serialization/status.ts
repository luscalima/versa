import { z } from 'zod'
import { hasPermission } from '../authorization/authorization'
import { Permissions } from '../authorization/permissions'
import type { DatabaseStatus } from '../database/database'
import type { UserContext } from '../users/user'

export const databaseStatusSchema = z
  .object({
    version: z.string(),
    maxConnections: z.number(),
    openedConnections: z.number(),
  })
  .strict()

export const publicStatusSchema = z
  .object({
    updatedAt: z.string().datetime(),
  })
  .strict()

export type PublicStatus = z.infer<typeof publicStatusSchema>

export const fullStatusSchema = publicStatusSchema.extend({
  database: databaseStatusSchema,
})

export type FullStatus = z.infer<typeof fullStatusSchema>

export function serializePublicStatus(updatedAt: Date = new Date()): PublicStatus {
  return {
    updatedAt: updatedAt.toISOString(),
  }
}

export function serializeFullStatus(
  status: DatabaseStatus,
  updatedAt: Date = new Date(),
): FullStatus {
  return {
    updatedAt: updatedAt.toISOString(),
    database: {
      version: status.version,
      maxConnections: status.maxConnections,
      openedConnections: status.openedConnections,
    },
  }
}

export function serializeStatusForRequester(
  status: DatabaseStatus,
  requester: UserContext,
  updatedAt: Date = new Date(),
) {
  return hasPermission(requester, Permissions.READ_STATUS_ALL)
    ? { schema: fullStatusSchema, data: serializeFullStatus(status, updatedAt) }
    : { schema: publicStatusSchema, data: serializePublicStatus(updatedAt) }
}
