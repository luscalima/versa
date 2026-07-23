export type GetMigrationsResponse = {
  completed: string[]
  pending: string[]
}

export default defineRouteHandler(async (): Promise<GetMigrationsResponse> => {
  const db = useDatabase()

  // dry run, create the migrations table if it doesn't exist
  const [completed, pending] = await db.migrate.list()

  return {
    completed,
    pending,
  }
})
