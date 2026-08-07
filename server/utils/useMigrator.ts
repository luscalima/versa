import { createMigrator } from '../models/migrator'

export function useMigrator() {
  return createMigrator(useDatabase())
}
