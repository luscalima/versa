import type { Knex } from 'knex'
import type { CreateUserProps } from '~~/server/modules/users/user'
import { User } from '~~/server/modules/users/user'
import type { UserRepository } from '~~/server/modules/users/userRepository'
import { useModelProps } from '~~/server/utils/useModelProps'

export class KnexUserRepository implements UserRepository {
  private readonly table = 'users'

  constructor(private readonly db: Knex) {}

  async findByUsername(username: string) {
    const findResult = await this.db(this.table)
      .whereRaw('LOWER(username) = ?', username.toLowerCase())
      .first()

    if (!findResult) {
      return null
    }

    const user = User.fromPersistence(findResult)

    return user
  }

  async findByEmail(email: string) {
    const findResult = await this.db(this.table)
      .whereRaw('LOWER(email) = ?', email.toLowerCase())
      .first()

    if (!findResult) {
      return null
    }

    const user = User.fromPersistence(findResult)

    return user
  }

  async save(user: User) {
    const [saveResult] = await this.db(this.table).insert(useModelProps(user)).returning('*')

    return saveResult
  }

  async update(username: string, payload: Partial<CreateUserProps>): Promise<object> {
    const [updateResult] = await this.db(this.table)
      .whereRaw('LOWER(username) = ?', username.toLowerCase())
      .update({
        ...payload,
        updated_at: this.db.fn.now(),
      })
      .returning('*')

    return updateResult
  }
}
