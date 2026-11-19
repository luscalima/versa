import type { Knex } from 'knex'
import { ActivationToken } from '~~/server/modules/activation/activationToken'
import type { ActivationRepository } from '~~/server/modules/activation/activationRepository'
import type { Permissions } from '~~/server/modules/authorization/permissions'
import type { User } from '~~/server/modules/users/user'

export class KnexActivationRepository implements ActivationRepository {
  private readonly tokensTable = 'user_activation_tokens'
  private readonly usersTable = 'users'

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

  async activate(id: string, permissions: Permissions[]): Promise<ActivationToken | null> {
    return this.db.transaction(async trx => {
      const now = trx.fn.now()

      const [token] = await trx(this.tokensTable)
        .where({ id })
        .whereNull('usedAt')
        .where('expiresAt', '>', now)
        .update({ usedAt: now, updatedAt: now })
        .returning('*')

      if (!token) {
        return null
      }

      await trx(this.usersTable).where({ id: token.userId }).update({ permissions, updatedAt: now })

      return ActivationToken.fromPersistence(token)
    })
  }
}
