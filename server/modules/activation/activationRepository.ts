import type { User } from '../users/user'
import type { ActivationToken } from './activationToken'

export interface ActivationRepository {
  save(user: User, expiresAt: Date): Promise<string>
  findValidById(id: string): Promise<ActivationToken | null>
}
