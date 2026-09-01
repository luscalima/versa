export type DatabaseStatus = {
  version: string
  maxConnections: number
  openedConnections: number
}

export type MigratorListResult = {
  completed: string[]
  pending: string[]
}

export type MigratorRunResult = {
  completed: string[]
}
