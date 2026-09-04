import { err, ok, type Result } from 'neverthrow'
import type { CreateUserProps } from './user'
import { User } from './user'
import type { UserRepository } from './userRepository'
import { conflictError, notFoundError } from '~~/server/utils/errors'
import type { HasherPort } from '../hasher/hasherPort'

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: HasherPort,
  ) {}

  async create(payload: CreateUserProps): Promise<Result<object, Error>> {
    const password = await this.hasher.password(payload.password)
    const transformedPayload = { ...payload, password }
    const user = User.create(transformedPayload)

    if (user.isErr()) {
      return err(
        unprocessableEntityError({
          message: user.error,
        }),
      )
    }

    const usernameResult = await this.userRepository.findByUsername(user.value.username)

    if (usernameResult) {
      return err(
        conflictError({
          code: 'USERNAME_ALREADY_IN_USE',
          message: 'This username is already being used by someone else',
        }),
      )
    }

    const emailResult = await this.userRepository.findByEmail(user.value.email)

    if (emailResult) {
      return err(
        conflictError({
          code: 'EMAIL_ALREADY_IN_USE',
          message: 'This email is already being used by someone else',
        }),
      )
    }

    const saveResult = await this.userRepository.save(user.value)

    Reflect.deleteProperty(saveResult, 'password')

    return ok(saveResult)
  }

  async findByUsername(username: string): Promise<Result<User, Error>> {
    const userResult = await this.userRepository.findByUsername(username)

    if (!userResult) {
      return err(
        notFoundError({
          code: 'USER_NOT_FOUND',
          message: `User with username '${username}' not found`,
        }),
      )
    }

    return ok(userResult)
  }
}
