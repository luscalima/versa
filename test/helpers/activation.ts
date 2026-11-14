import type { ActivationToken } from '#server/modules/activation/activationToken'
import { getDatabase } from './database'
import { activationRepository } from './repositories'

export async function getValidActivationTokenById(id: string): Promise<ActivationToken | null> {
  const repository = await activationRepository()

  return repository.findValidById(id)
}

export async function expireActivationTokenById(id: string): Promise<void> {
  const db = await getDatabase()

  await db('user_activation_tokens')
    .where({ id })
    .update({ expiresAt: new Date(Date.now() - 1000) })
}
