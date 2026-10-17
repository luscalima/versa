import { err, ok, type Result } from 'neverthrow'
import type { DatabaseStatus, MigratorListResult, MigratorRunResult } from './database'
import type { DatabaseRepository } from './databaseRepository'
import { toAppError, type AppError } from '~~/server/utils/errors'

export class DatabaseService {
  constructor(private readonly repository: DatabaseRepository) {}

  async getStatus(): Promise<Result<DatabaseStatus, AppError>> {
    return this.execute(() => this.repository.getStatus())
  }

  async listMigrations(): Promise<Result<MigratorListResult, AppError>> {
    return this.execute(() => this.repository.listMigrations())
  }

  async runMigrations(): Promise<Result<MigratorRunResult, AppError>> {
    return this.execute(() => this.repository.runMigrations())
  }

  private async execute<T>(action: () => Promise<T>): Promise<Result<T, AppError>> {
    try {
      return ok(await action())
    } catch (error) {
      return err(toAppError(error))
    }
  }
}
