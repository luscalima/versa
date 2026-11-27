import { fetch } from 'ofetch'
import { randomUUID } from 'node:crypto'
import {
  api,
  activationRepository,
  destroyDatabase,
  downDatabase,
  dynamicMocks,
  expireActivationTokenById,
  restoreDatabase,
  userRepository,
} from '#test/helpers'
import { Permissions } from '#server/modules/authorization/permissions'
import type { UserProps } from '#server/modules/users/user'
import type { ActivationTokenProps } from '#server/modules/activation/activationToken'
import type { SessionProps } from '#server/modules/sessions/session'

describe('PATCH /v1/activations/:tokenId', async () => {
  let inactiveUser: UserProps
  let activationToken: ActivationTokenProps
  let activatedUser: UserProps
  let activatedSession: SessionProps

  beforeEach(async () => {
    inactiveUser = await dynamicMocks.createUser(
      { permissions: [Permissions.READ_ACTIVATION_TOKEN] },
      { merge: true, rebuild: true },
    )
    activationToken = await dynamicMocks.createActivationToken({ userId: inactiveUser.id })
    activatedUser = await dynamicMocks.createUser(
      {
        username: 'JaneDoe',
        email: 'jane.doe@example.com',
        permissions: [Permissions.CREATE_SESSION],
      },
      { merge: true },
    )
    activatedSession = await dynamicMocks.createSession(
      { userId: activatedUser.id },
      { merge: true },
    )
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  async function requestActivation(tokenId?: string, sessionToken?: string) {
    return fetch(api(`/v1/activations/${tokenId ?? 'undefined'}`), {
      method: 'PATCH',
      headers: sessionToken ? { Cookie: `session_id=${sessionToken}` } : undefined,
    })
  }

  const forbiddenBody = {
    statusCode: 403,
    message: 'You do not have permission to perform this action',
    data: {
      code: 'ACCESS_DENIED',
      missing: [Permissions.READ_ACTIVATION_TOKEN],
    },
  }

  const unavailableBody = {
    statusCode: 400,
    message: 'The provided token is invalid or expired.',
    data: {
      code: 'TOKEN_UNAVAILABLE',
    },
  }

  describe('Anonymous user', () => {
    it('Activates the account and consumes the token', async () => {
      const response = await requestActivation(activationToken.id)

      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data).toMatchObject({
        id: activationToken.id,
        userId: inactiveUser.id,
      })
      expect(data.usedAt).not.toBeNull()
      expect(Date.parse(data.usedAt)).not.toBeNaN()
      expect(Date.parse(data.expiresAt)).not.toBeNaN()

      const repository = await activationRepository()

      expect(await repository.findValidById(activationToken.id)).toBeNull()

      const users = await userRepository()
      const activated = await users.findById(inactiveUser.id)

      expect(activated?.permissions).toEqual([
        Permissions.CREATE_SESSION,
        Permissions.READ_SESSION,
        Permissions.UPDATE_USER,
      ])
    })

    it('Does not activate other users', async () => {
      const otherUser = await dynamicMocks.createUser(
        {
          username: 'JohnnyDoe',
          email: 'johnny.doe@example.com',
          permissions: [Permissions.READ_ACTIVATION_TOKEN],
        },
        { merge: true },
      )
      const otherToken = await dynamicMocks.createActivationToken({ userId: otherUser.id })

      expect((await requestActivation(activationToken.id)).status).toBe(200)

      const users = await userRepository()
      const repository = await activationRepository()

      expect((await users.findById(otherUser.id))?.permissions).toEqual([
        Permissions.READ_ACTIVATION_TOKEN,
      ])
      expect(await repository.findValidById(otherToken.id)).not.toBeNull()
    })

    it('Rejects a missing token', async () => {
      const response = await requestActivation()

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        statusCode: 400,
        message: 'Activation token is invalid',
        data: {
          code: 'INVALID_ACTIVATION_TOKEN',
        },
      })
    })

    it('Rejects a malformed token', async () => {
      const response = await requestActivation('not-a-uuid')

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual(unavailableBody)
    })

    it('Rejects an unknown token', async () => {
      const response = await requestActivation(randomUUID())

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual(unavailableBody)
    })

    it('Rejects an expired token', async () => {
      await expireActivationTokenById(activationToken.id)

      const response = await requestActivation(activationToken.id)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual(unavailableBody)
    })

    it('Rejects a token whose owner cannot activate', async () => {
      const owner = await dynamicMocks.createUser(
        {
          username: 'ActivatedUser',
          email: 'activated@example.com',
          permissions: [Permissions.CREATE_SESSION],
        },
        { merge: true },
      )
      const token = await dynamicMocks.createActivationToken({ userId: owner.id })

      const response = await requestActivation(token.id)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual(forbiddenBody)
    })

    it('Rejects a second activation attempt', async () => {
      expect((await requestActivation(activationToken.id)).status).toBe(200)

      const response = await requestActivation(activationToken.id)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual(forbiddenBody)
    })
  })

  describe('Authenticated user', () => {
    it('Activates an account when the requester can activate', async () => {
      const session = await dynamicMocks.createSession(
        { userId: inactiveUser.id, token: 'a'.repeat(96) },
        { merge: true },
      )

      const response = await requestActivation(activationToken.id, session.token)

      expect(response.status).toBe(200)
    })

    it('Allows a requester without "READ_ACTIVATION_TOKEN"', async () => {
      const response = await requestActivation(activationToken.id, activatedSession.token)

      expect(response.status).toBe(200)

      const repository = await activationRepository()

      expect(await repository.findValidById(activationToken.id)).toBeNull()
    })
  })

  describe('With unexpected server errors', () => {
    it('Returns 503 when the database is unavailable', async () => {
      await downDatabase()

      const response = await requestActivation(activationToken.id)

      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({
        statusCode: 503,
        message: 'The operation could not be completed at this time. Please try again later.',
        data: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      })

      await restoreDatabase()
    })
  })
})
