import apiManifest from '#api-manifest'

export default defineRouteHandler(async (event): Promise<unknown> => {
  const { path, method } = event

  if (apiManifest[path]) {
    if (!apiManifest[path].includes(method)) {
      throw methodNotAllowedError({
        message: 'The HTTP method used is not allowed for this endpoint.',
      })
    }
  } else {
    setResponseStatus(event, 404)
  }

  return
})
