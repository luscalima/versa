export default defineRouteHandler(async event => {
  const migrator = useMigrator()
  const { completed } = await migrator.run()

  setResponseStatus(event, completed.length > 0 ? 201 : 200)

  return {
    completed,
  }
})
