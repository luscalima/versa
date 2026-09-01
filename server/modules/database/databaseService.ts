import type { DatabaseStatus, MigratorListResult, MigratorRunResult } from './database'
import type { DatabaseRepository } from './databaseRepository'

export class DatabaseService {
  constructor(private readonly repository: DatabaseRepository) {}

  async getStatus(): Promise<DatabaseStatus> {
    return this.repository.getStatus()
  }

  async listMigrations(): Promise<MigratorListResult> {
    return this.repository.listMigrations()
  }

  async runMigrations(): Promise<MigratorRunResult> {
    return this.repository.runMigrations()
  }
}
