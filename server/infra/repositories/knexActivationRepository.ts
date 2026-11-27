import type { Knex } from 'knex'
import { ActivationToken } from '~~/server/modules/activation/activationToken'
import type { ActivationRepository } from '~~/server/modules/activation/activationRepository'
import type { Permissions } from '~~/server/modules/authorization/permissions'
import { User } from '~~/server/modules/users/user'

const TOKEN_COLUMNS = ['id', 'userId', 'usedAt', 'expiresAt', 'createdAt', 'updatedAt']
const USER_COLUMNS = [
  'id',
  'username',
  'email',
  'password',
  'permissions',
  'createdAt',
  'updatedAt',
]

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
      .returning('id')

    return saveResult.id
  }

  async findValidById(id: string): Promise<ActivationToken | null> {
    const token = await this.db(this.tokensTable)
      .select(...TOKEN_COLUMNS)
      .where({ id })
      .whereNull('usedAt')
      .where('expiresAt', '>', new Date())
      .first()

    if (!token) {
      return null
    }

    return ActivationToken.fromPersistence(token)
  }

  async findUserByTokenId(tokenId: string): Promise<User | null> {
    const user = await this.db(this.usersTable)
      .select(USER_COLUMNS.map(column => `${this.usersTable}.${column}`))
      .join(this.tokensTable, `${this.usersTable}.id`, `${this.tokensTable}.userId`)
      .where(`${this.tokensTable}.id`, tokenId)
      .first()

    if (!user) {
      return null
    }

    return User.fromPersistence(user)
  }

  async activate(id: string, permissions: Permissions[]): Promise<ActivationToken | null> {
    return this.db.transaction(async trx => {
      const now = trx.fn.now()

      const [token] = await trx(this.tokensTable)
        .where({ id })
        .whereNull('usedAt')
        .where('expiresAt', '>', now)
        .update({ usedAt: now, updatedAt: now })
        .returning(TOKEN_COLUMNS)

      if (!token) {
        return null
      }

      await trx(this.usersTable).where({ id: token.userId }).update({ permissions, updatedAt: now })

      return ActivationToken.fromPersistence(token)
    })
  }
}
