export default defineRouteHandler(async event => {
  const db = useDatabase()

  // live run, run the pending migrations
  const [, completed] = await db.migrate.latest()
  const statusCode = completed.length > 0 ? 201 : 200

  setResponseStatus(event, statusCode)

  return {
    completed,
  }
})
