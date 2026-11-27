import type { Knex } from 'knex'
import type { CreateUserProps } from '~~/server/modules/users/user'
import { User } from '~~/server/modules/users/user'
import type { UserRepository } from '~~/server/modules/users/userRepository'
import { useModelProps } from '~~/server/utils/useModelProps'

const USER_COLUMNS = [
  'id',
  'username',
  'email',
  'password',
  'permissions',
  'createdAt',
  'updatedAt',
]

export class KnexUserRepository implements UserRepository {
  private readonly table = 'users'

  constructor(private readonly db: Knex) {}

  async findByUsername(username: string): Promise<User | null> {
    const findResult = await this.db(this.table)
      .select(...USER_COLUMNS)
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
      .select(...USER_COLUMNS)
      .whereRaw('LOWER(email) = ?', email.toLowerCase())
      .first()

    if (!findResult) {
      return null
    }

    const user = User.fromPersistence(findResult)

    return user
  }

  async findById(id: string): Promise<User | null> {
    const findResult = await this.db(this.table)
      .select(...USER_COLUMNS)
      .where({ id })
      .first()

    if (!findResult) {
      return null
    }

    const user = User.fromPersistence(findResult)

    return user
  }

  async save(user: User): Promise<User> {
    const [saveResult] = await this.db(this.table)
      .insert(useModelProps(user))
      .returning(USER_COLUMNS)

    return User.fromPersistence(saveResult)
  }

  async update(username: string, payload: Partial<CreateUserProps>): Promise<User> {
    const [updateResult] = await this.db(this.table)
      .whereRaw('LOWER(username) = ?', username.toLowerCase())
      .update({
        ...payload,
        updatedAt: this.db.fn.now(),
      })
      .returning(USER_COLUMNS)

    return User.fromPersistence(updateResult)
  }
}
