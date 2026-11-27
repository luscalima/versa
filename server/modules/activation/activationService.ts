import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { MailPort } from '../mail/mailPort'
import type { User } from '../users/user'
import type { ActivationRepository } from './activationRepository'
import type { AppError } from '~~/server/utils/errors'
import { useAppUrl } from '~~/server/utils/useAppUrl'
import { Permissions } from '../authorization/permissions'
import type { ActivationToken } from './activationToken'
import { can } from '../authorization/authorization'

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
    const user = await this.activationRepository.findUserByTokenId(tokenId)

    if (!user) {
      return err(
        badRequestError({
          code: 'TOKEN_UNAVAILABLE',
          message: 'The provided token is invalid or expired.',
        }),
      )
    }

    const authorizationResult = can(Permissions.READ_ACTIVATION_TOKEN, { subject: user })

    if (authorizationResult.isErr()) {
      return err(authorizationResult.error)
    }

    const token = await this.activationRepository.activate(tokenId, [
      Permissions.CREATE_SESSION,
      Permissions.READ_SESSION,
      Permissions.UPDATE_USER,
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
