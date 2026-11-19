import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { MailPort } from '../mail/mailPort'
import type { User } from '../users/user'
import type { ActivationRepository } from './activationRepository'
import type { AppError } from '~~/server/utils/errors'
import { useAppUrl } from '~~/server/utils/useAppUrl'
import { Permission } from '../authorization/permissions'
import type { ActivationToken } from './activationToken'

export class ActivationService {
  static EXPIRATION_IN_MILLISECONDS = 15 * 60 * 1000

  constructor(
    private activationRepository: ActivationRepository,
    private mailer: MailPort,
  ) {}

  async create(user: User): Promise<Result<string, AppError>> {
    const expiresAt = new Date(Date.now() + ActivationService.EXPIRATION_IN_MILLISECONDS)

    const saveResult = await this.activationRepository.save(user, expiresAt)

    return ok(saveResult)
  }

  async sendNewUserEmail(user: User, token: string): Promise<void> {
    const appUrl = useAppUrl()

    await this.mailer.send({
      from: 'contact@versa.com',
      subject: 'Activate your account',
      text: `Hi, ${user.username}! Activate your account by clicking the link below:

${appUrl}/register/activate/${token}
`,
      to: user.email,
    })
  }

  async activate(tokenId: string): Promise<Result<ActivationToken, AppError>> {
    const token = await this.activationRepository.activate(tokenId, [
      Permission.CREATE_SESSIONS,
      Permission.READ_SESSIONS,
      Permission.UPDATE_USERS,
    ])

    if (!token) {
      return err(
        badRequestError({
          code: 'TOKEN_UNAVAILABLE',
          message: 'The provided token is invalid or expired.',
        }),
      )
    }

    return ok(token)
  }
}
