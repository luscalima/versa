import { NodemailerMailAdapter } from '~~/server/infra/adapters/nodemailerMailAdapter'
import { KnexActivationRepository } from '~~/server/infra/repositories/knexActivationRepository'
import { ActivationService } from '~~/server/modules/activation/activationService'

export default defineRouteHandler(async event => {
  const tokenId = getRouterParam(event, 'tokenId')!

  const runtimeConfig = useRuntimeConfig()
  const db = useDatabase()
  const activationRepository = new KnexActivationRepository(db)
  const mailerPort = new NodemailerMailAdapter(runtimeConfig.mail)
  const activationService = new ActivationService(activationRepository, mailerPort)
  const activationResult = await activationService.activate(tokenId)

  if (activationResult.isErr()) {
    return activationResult.error
  }

  setResponseStatus(event, 200)

  return activationResult.value.toDTO()
})
