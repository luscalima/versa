import { err, ok, type Result } from 'neverthrow'
import type { User } from '../users/user'
import type { UserRepository } from '../users/userRepository'
import { unauthorizedError } from '~~/server/utils/errors'
import type { AppError } from '~~/server/utils/errors'
import type { HasherPort } from '../hasher/hasherPort'
import { Session } from './session'
import type { SessionRepository } from './sessionRepository'
import type { GeneratorPort } from '../generator/generatorPort'

export class SessionService {
  static EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000 // 30 days

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
    private readonly hasher: HasherPort,
    private readonly generator: GeneratorPort,
  ) {}

  async create(userId: string): Promise<Result<Session, AppError>> {
    const id = this.generator.randomUUID()
    const token = this.generator.randomToken()
    const expiresAt = this.generator.futureDate(SessionService.EXPIRATION_IN_MILLISECONDS)
    const session = Session.create({ id, userId, token, expiresAt })

    const saveResult = await this.sessionRepository.save(session)

    return ok(saveResult)
  }

  async authenticate(email: string, password: string): Promise<Result<User, AppError>> {
    const emailResult = await this.userRepository.findByEmail(email)
    const passwordToTest = emailResult?.password ?? this.hasher.dummyHash
    const passwordResult = await this.hasher.compare(password, passwordToTest)

    if (!emailResult || !passwordResult) {
      return err(
        unauthorizedError({
          message: 'Authentication data does not match',
        }),
      )
    }

    return ok(emailResult)
  }

  async getValid(token: string): Promise<Result<Session, AppError>> {
    const sessionResult = await this.sessionRepository.findOneByToken(token)

    if (!sessionResult || sessionResult.expiresAt.getTime() < Date.now()) {
      return err(
        unauthorizedError({
          message: 'Session is invalid or has expired',
        }),
      )
    }

    return ok(sessionResult)
  }

  async renew(id: string): Promise<Result<Session, AppError>> {
    const expiresAt = this.generator.futureDate(SessionService.EXPIRATION_IN_MILLISECONDS)
    const updateResult = await this.sessionRepository.update(id, {
      expiresAt,
      updatedAt: new Date(),
    })

    return ok(updateResult)
  }
}
