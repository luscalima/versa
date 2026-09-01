import { User } from '~~/server/modules/users/user'
import type { UserRepository } from '~~/server/modules/users/userRepository'
import { useModelProps } from '~~/server/utils/useModelProps'

export class KnexUserRepository implements UserRepository {
  private readonly db = useDatabase()
  private readonly table = 'users'

  async findByUsername(username: string) {
    const findResult = await this.db(this.table).where({ username }).first()

    if (!findResult) {
      return null
    }

    const user = User.fromPersistence(findResult)

    return user
  }

  async findByEmail(email: string) {
    const findResult = await this.db(this.table).where({ email }).first()

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
}
