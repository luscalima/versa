import type { Knex } from 'knex'
import { ActivationToken } from '~~/server/modules/activation/activationToken'
import type { ActivationRepository } from '~~/server/modules/activation/activationRepository'
import type { User } from '~~/server/modules/users/user'

export class KnexActivationRepository implements ActivationRepository {
  private readonly tokensTable = 'user_activation_tokens'

  constructor(private readonly db: Knex) {}

  async save(user: User, expiresAt: Date): Promise<string> {
    const [saveResult] = await this.db(this.tokensTable)
      .insert({
        userId: user.id,
        expiresAt,
      })
      .returning('*')

    return saveResult.id
  }

  async findValidById(id: string): Promise<ActivationToken | null> {
    const token = await this.db(this.tokensTable)
      .where({ id })
      .whereNull('usedAt')
      .where('expiresAt', '>', new Date())
      .first()

    if (!token) {
      return null
    }

    return ActivationToken.fromPersistence(token)
  }
}
