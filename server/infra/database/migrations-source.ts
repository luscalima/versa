import { migrations } from './migrations-registry'

type MigrationModule = {
  name: string
  module: {
    up: () => Promise<void>
    down: () => Promise<void>
  }
}

export async function createMigrationSource() {
  return {
    async getMigrations() {
      return migrations
    },

    getMigrationName(migration: MigrationModule) {
      return migration.name
    },

    async getMigration(migration: MigrationModule) {
      return migration.module
    },
  }
}
