import type { DatabaseStatus, MigratorListResult, MigratorRunResult } from './database'

export interface DatabaseRepository {
  getStatus(): Promise<DatabaseStatus>
  listMigrations(): Promise<MigratorListResult>
  runMigrations(): Promise<MigratorRunResult>
}
