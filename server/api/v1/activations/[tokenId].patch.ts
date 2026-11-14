import { z } from 'zod'
import { NodemailerMailAdapter } from '~~/server/infra/adapters/nodemailerMailAdapter'
import { KnexActivationRepository } from '~~/server/infra/repositories/knexActivationRepository'
import { ActivationService } from '~~/server/modules/activation/activationService'
import { badRequestError } from '~~/server/utils/errors'
import { useValidateParams } from '~~/server/utils/useValidateParams'

const activationTokenParamsSchema = z.object({
  tokenId: z.string().uuid(),
})

export default defineRouteHandler(async event => {
  const tokenId = getRouterParam(event, 'tokenId')

  if (!tokenId || tokenId === 'undefined') {
    return badRequestError({
      code: 'INVALID_ACTIVATION_TOKEN',
      message: 'Activation token is invalid',
    })
  }

  const params = await useValidateParams(
    event,
    activationTokenParamsSchema,
    'The provided token is invalid or expired.',
    'TOKEN_UNAVAILABLE',
  )

  if (params.isErr()) {
    return params.error
  }

  const runtimeConfig = useRuntimeConfig()
  const db = useDatabase()
  const activationRepository = new KnexActivationRepository(db)
  const mailerPort = new NodemailerMailAdapter(runtimeConfig.mail)
  const activationService = new ActivationService(activationRepository, mailerPort)
  const activationResult = await activationService.activate(params.value.tokenId)

  if (activationResult.isErr()) {
    return activationResult.error
  }

  setResponseStatus(event, 200)

  return activationResult.value.toDTO()
})
