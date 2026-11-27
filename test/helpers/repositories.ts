import { KnexActivationRepository } from '#server/infra/repositories/knexActivationRepository'
import { KnexSessionRepository } from '#server/infra/repositories/knexSessionRepository'
import { KnexUserRepository } from '#server/infra/repositories/knexUserRepository'
import { getDatabase } from './database'

export async function activationRepository() {
  return new KnexActivationRepository(await getDatabase())
}

export async function sessionRepository() {
  return new KnexSessionRepository(await getDatabase())
}

export async function userRepository() {
  return new KnexUserRepository(await getDatabase())
}
