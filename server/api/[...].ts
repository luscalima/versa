import apiManifest from '#api-manifest'

export default defineRouteHandler(async (event): Promise<unknown> => {
  const { path, method } = event

  if (!apiManifest[path]) {
    throw notFoundError({
      message: 'The requested resource could not be found.',
    })
  }

  if (!apiManifest[path].includes(method)) {
    throw methodNotAllowedError({
      message: 'The HTTP method used is not allowed for this endpoint.',
    })
  }

  return
})
