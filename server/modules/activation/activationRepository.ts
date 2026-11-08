import type { User } from '../users/user'

export interface ActivationRepository {
  save(user: User, expiresAt: Date): Promise<string>
}
