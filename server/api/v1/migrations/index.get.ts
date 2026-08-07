export type GetMigrationsResponse = {
  completed: string[]
  pending: string[]
}

export default defineRouteHandler(async (): Promise<GetMigrationsResponse> => {
  const migrator = useMigrator()

  return await migrator.list()
})
