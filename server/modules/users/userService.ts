import { err, ok, type Result } from 'neverthrow'
import type { CreateUserProps } from './user'
import { User } from './user'
import type { UserRepository } from './userRepository'
import { conflictError, notFoundError, unprocessableEntityError } from '~~/server/utils/errors'
import type { AppError } from '~~/server/utils/errors'
import type { HasherPort } from '../hasher/hasherPort'

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: HasherPort,
  ) {}

  async create(payload: CreateUserProps): Promise<Result<User, AppError>> {
    const password = await this.hasher.hash(payload.password)
    const transformedPayload = { ...payload, password }
    const user = User.create(transformedPayload)

    if (user.isErr()) {
      return err(
        unprocessableEntityError({
          message: user.error.message,
        }),
      )
    }

    const usernameCheck = await this.ensureUnique('username', user.value.username)
    if (usernameCheck.isErr()) return err(usernameCheck.error)

    const emailCheck = await this.ensureUnique('email', user.value.email)
    if (emailCheck.isErr()) return err(emailCheck.error)

    const saveResult = await this.userRepository.save(user.value)

    return ok(saveResult)
  }

  async getByUsername(username: string): Promise<Result<User, AppError>> {
    const userResult = await this.userRepository.findByUsername(username)

    if (!userResult) {
      return this.notFoundError(username)
    }

    return ok(userResult)
  }

  async getByEmail(email: string): Promise<Result<User, AppError>> {
    const userResult = await this.userRepository.findByEmail(email)

    if (!userResult) {
      return this.notFoundError(email)
    }

    return ok(userResult)
  }

  async getById(id: string): Promise<Result<User, AppError>> {
    const userResult = await this.userRepository.findById(id)

    if (!userResult) {
      return this.notFoundError(id)
    }

    return ok(userResult)
  }

  async update(
    username: string,
    payload: Partial<CreateUserProps>,
  ): Promise<Result<User, AppError>> {
    const userResult = await this.userRepository.findByUsername(username)

    if (!userResult) {
      return this.notFoundError(username)
    }

    if (payload.username && payload.username !== userResult.username) {
      const usernameCheck = await this.ensureUnique('username', payload.username)
      if (usernameCheck.isErr()) return err(usernameCheck.error)
    }

    if (payload.email && payload.email !== userResult.email) {
      const emailCheck = await this.ensureUnique('email', payload.email)
      if (emailCheck.isErr()) return err(emailCheck.error)
    }

    const transformedPayload = { ...payload }

    if (payload.password) {
      transformedPayload.password = await this.hasher.hash(payload.password)
    }

    if (payload.email) {
      transformedPayload.email = payload.email.toLowerCase()
    }

    const updateResult = await this.userRepository.update(username, transformedPayload)

    return ok(updateResult)
  }

  private async ensureUnique(
    field: 'username' | 'email',
    value: string,
  ): Promise<Result<undefined, AppError>> {
    const existing =
      field === 'username'
        ? await this.userRepository.findByUsername(value)
        : await this.userRepository.findByEmail(value)

    if (existing) {
      return err(
        conflictError({
          code: `${field.toUpperCase()}_ALREADY_IN_USE`,
          message: `This ${field} is already being used by someone else`,
        }),
      )
    }

    return ok(undefined)
  }

  private notFoundError(username: string): Result<User, AppError> {
    return err(
      notFoundError({
        code: 'USER_NOT_FOUND',
        message: `User with username '${username}' not found`,
      }),
    )
  }
}
