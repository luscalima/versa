import { z } from 'zod'
import type { MigratorListResult, MigratorRunResult } from '../database/database'

export const migrationListSchema = z
  .object({
    completed: z.array(z.string()),
    pending: z.array(z.string()),
  })
  .strict()

export type MigrationListResponse = z.infer<typeof migrationListSchema>

export const migrationRunSchema = z
  .object({
    completed: z.array(z.string()),
  })
  .strict()

export type MigrationRunResponse = z.infer<typeof migrationRunSchema>

export function serializeMigrationList(result: MigratorListResult): MigrationListResponse {
  return {
    completed: result.completed,
    pending: result.pending,
  }
}

export function serializeMigrationRun(result: MigratorRunResult): MigrationRunResponse {
  return {
    completed: result.completed,
  }
}
