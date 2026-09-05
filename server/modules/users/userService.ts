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

    const usernameCheck = await this.ensureUnique('username', user.value.username)
    if (usernameCheck) return err(usernameCheck)

    const emailCheck = await this.ensureUnique('email', user.value.email)
    if (emailCheck) return err(emailCheck)

    const saveResult = await this.userRepository.save(user.value)

    return ok(this.stripPassword(saveResult))
  }

  async findByUsername(username: string): Promise<Result<User, Error>> {
    const userResult = await this.userRepository.findByUsername(username)

    if (!userResult) {
      return this.notFoundError(username)
    }

    return ok(userResult)
  }

  async update(
    username: string,
    payload: Partial<CreateUserProps>,
  ): Promise<Result<object, Error>> {
    const userResult = await this.userRepository.findByUsername(username)

    if (!userResult) {
      return this.notFoundError(username)
    }

    if (payload.username && payload.username !== userResult.username) {
      const usernameCheck = await this.ensureUnique('username', payload.username)
      if (usernameCheck) return err(usernameCheck)
    }

    if (payload.email && payload.email !== userResult.email) {
      const emailCheck = await this.ensureUnique('email', payload.email)
      if (emailCheck) return err(emailCheck)
    }

    const transformedPayload = { ...payload }

    if (payload.password) {
      transformedPayload.password = await this.hasher.password(payload.password)
    }

    if (payload.email) {
      transformedPayload.email = payload.email.toLowerCase()
    }

    const updateResult = await this.userRepository.update(username, transformedPayload)

    return ok(this.stripPassword(updateResult))
  }

  private async ensureUnique(
    field: 'username' | 'email',
    value: string,
  ): Promise<Error | undefined> {
    const existing =
      field === 'username'
        ? await this.userRepository.findByUsername(value)
        : await this.userRepository.findByEmail(value)

    if (existing) {
      return conflictError({
        code: `${field.toUpperCase()}_ALREADY_IN_USE`,
        message: `This ${field} is already being used by someone else`,
      })
    }
  }

  private stripPassword(obj: object) {
    const result = { ...obj }
    Reflect.deleteProperty(result, 'password')
    return result
  }

  private notFoundError(username: string) {
    return err(
      notFoundError({
        code: 'USER_NOT_FOUND',
        message: `User with username '${username}' not found`,
      }),
    )
  }
}
