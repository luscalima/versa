import { err, ok, type Result } from 'neverthrow'
import type { User } from './user'
import type { UserRepository } from './userRepository'
import { conflictError } from '~~/server/utils/errors'

// TODO: criar macros globais para tipos do neverthrow
// TODO: implementar novas macros globais
// TODO: commitar alterações
// TODO: conitnuar...

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(user: User): Promise<Result<object, Error>> {
    const usernameResult = await this.userRepository.findByUsername(user.username)

    if (usernameResult) {
      return err(
        conflictError({
          code: 'USERNAME_ALREADY_IN_USE',
          message: 'This username is already being used by someone else',
        }),
      )
    }

    const emailResult = await this.userRepository.findByEmail(user.email)

    if (emailResult) {
      return err(
        conflictError({
          code: 'EMAIL_ALREADY_IN_USE',
          message: 'This email is already being used by someone else',
        }),
      )
    }

    const saveResult = await this.userRepository.save(user)

    Reflect.deleteProperty(saveResult, 'password')

    return ok(saveResult)
  }
}
