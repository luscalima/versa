import { fetch } from 'ofetch'
import {
  api,
  clearDatabase,
  destroyDatabase,
  restoreDatabase,
  dynamicMocks,
  staticMocks,
} from '#test/helpers'
import type { UserProps } from '#server/modules/users/user'
import { SessionService } from '#server/modules/sessions/sessionService'
import { version as uuidVersion } from 'uuid'
import setCookieParser from 'set-cookie-parser'

describe('POST /v1/sessions', async () => {
  let user: UserProps

  beforeEach(async () => {
    user = await dynamicMocks.createUser(null, { rebuild: true })
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  async function requestSessionCreation(payload: Record<string, unknown>) {
    return fetch(api('/v1/sessions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }

  describe('Anonymous user', () => {
    it('With correct "password" but incorrect "email"', async () => {
      const response = await requestSessionCreation({
        email: 'invalid@email.com',
        password: staticMocks.user.password,
      })

      expect(response.status).toBe(401)

      const data = await response.json()

      expect(data).toEqual({
        status_code: 401,
        message: 'Authentication data does not match',
        data: {
          code: 'UNAUTHORIZED',
        },
      })
    })

    it('With correct "email" but incorrect "password"', async () => {
      const response = await requestSessionCreation({
        email: staticMocks.user.email,
        password: 'InvalidPassword123',
      })

      expect(response.status).toBe(401)

      const data = await response.json()

      expect(data).toEqual({
        status_code: 401,
        message: 'Authentication data does not match',
        data: {
          code: 'UNAUTHORIZED',
        },
      })
    })

    it('With incorrect "email" and incorrect "password"', async () => {
      const response = await requestSessionCreation({
        email: 'invalid@email.com',
        password: 'InvalidPassword123',
      })

      expect(response.status).toBe(401)

      const data = await response.json()

      expect(data).toEqual({
        status_code: 401,
        message: 'Authentication data does not match',
        data: {
          code: 'UNAUTHORIZED',
        },
      })
    })

    it('With correct "email" and correct "password"', async () => {
      const response = await requestSessionCreation({
        email: staticMocks.user.email,
        password: staticMocks.user.password,
      })

      expect(response.status).toBe(201)

      const data = await response.json()

      expect(data).toEqual({
        id: data.id,
        user_id: user.id,
        token: data.token,
        expires_at: data.expires_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      })
      expect(uuidVersion(data.id)).toBe(4)
      expect(Date.parse(data.expires_at)).not.toBeNaN()
      expect(Date.parse(data.created_at)).not.toBeNaN()
      expect(Date.parse(data.updated_at)).not.toBeNaN()

      const createdAt = new Date(data.created_at)
      const expiresAt = new Date(data.expires_at)

      createdAt.setMilliseconds(0)
      expiresAt.setMilliseconds(0)

      const expiresDiff = expiresAt.getTime() - createdAt.getTime()

      expect(expiresDiff).toBe(SessionService.EXPIRATION_IN_MILLISECONDS)

      const setCookie = setCookieParser(response, { map: true })

      expect(setCookie.session_id).toEqual({
        name: 'session_id',
        value: data.token,
        maxAge: SessionService.EXPIRATION_IN_MILLISECONDS / 1000,
        path: '/',
        httpOnly: true,
      })
    })

    describe('With unexpected server errors', async () => {
      it('Database is unavailable', async () => {
        await clearDatabase()
        await destroyDatabase()

        const response = await requestSessionCreation({
          email: staticMocks.user.email,
          password: staticMocks.user.password,
        })
        const errorResponse = await response.json()

        expect(response.status).toBe(503)
        expect(errorResponse).toEqual({
          status_code: 503,
          message: 'The operation could not be completed at this time. Please try again later.',
          data: { code: 'INTERNAL_SERVER_ERROR' },
        })

        await restoreDatabase()
      })
    })
  })
})
