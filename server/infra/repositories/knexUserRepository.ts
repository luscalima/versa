import type { Knex } from 'knex'
import type { CreateUserProps } from '~~/server/modules/users/user'
import { User } from '~~/server/modules/users/user'
import type { UserRepository } from '~~/server/modules/users/userRepository'
import { useModelProps } from '~~/server/utils/useModelProps'

export class KnexUserRepository implements UserRepository {
  private readonly table = 'users'

  constructor(private readonly db: Knex) {}

  async findByUsername(username: string): Promise<User | null> {
    const findResult = await this.db(this.table)
      .whereRaw('LOWER(username) = ?', username.toLowerCase())
      .first()

    if (!findResult) {
      return null
    }

    const user = User.fromPersistence(findResult)

    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    const findResult = await this.db(this.table)
      .whereRaw('LOWER(email) = ?', email.toLowerCase())
      .first()

    if (!findResult) {
      return null
    }

    const user = User.fromPersistence(findResult)

    return user
  }

  async findById(id: string): Promise<User | null> {
    const findResult = await this.db(this.table).where({ id }).first()

    if (!findResult) {
      return null
    }

    const user = User.fromPersistence(findResult)

    return user
  }

  async save(user: User): Promise<User> {
    const [saveResult] = await this.db(this.table).insert(useModelProps(user)).returning('*')

    return User.fromPersistence(saveResult)
  }

  async update(username: string, payload: Partial<CreateUserProps>): Promise<User> {
    const [updateResult] = await this.db(this.table)
      .whereRaw('LOWER(username) = ?', username.toLowerCase())
      .update({
        ...payload,
        updatedAt: this.db.fn.now(),
      })
      .returning('*')

    return User.fromPersistence(updateResult)
  }
}
