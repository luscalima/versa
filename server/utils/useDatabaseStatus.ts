import { createDatabaseStatus } from '../models/database-status'

export function useDatabaseStatus() {
  return createDatabaseStatus(useDatabase(), {
    databaseName: useRuntimeConfig().database.name,
  })
}
