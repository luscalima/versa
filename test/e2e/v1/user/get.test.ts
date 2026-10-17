import { fetch } from 'ofetch'
import { api, destroyDatabase, dynamicMocks } from '#test/helpers'
import type { UserProps } from '#server/modules/users/user'
import { version as uuidVersion } from 'uuid'
import type { SessionProps } from '#server/modules/sessions/session'
import { SessionService } from '#server/modules/sessions/sessionService'
import setCookieParser from 'set-cookie-parser'

describe('GET /v1/user', async () => {
  let createdUser: UserProps
  let createdSession: SessionProps

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    })
    createdUser = await dynamicMocks.createUser(null, { rebuild: true })
    createdSession = await dynamicMocks.createSession({ userId: createdUser.id }, { merge: true })
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  describe('Default user', () => {
    it('With valid session', async () => {
      const response = await fetch(api('/v1/user'), {
        headers: {
          Cookie: `session_id=${createdSession.token}`,
        },
      })

      expect(response.status).toBe(200)

      const userData = await response.json()

      expect(userData).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        createdAt: createdUser.createdAt?.toISOString(),
        updatedAt: createdUser.updatedAt?.toISOString(),
      })

      expect(uuidVersion(userData.id)).toBe(4)

      // Session renewal assertions
      const renewedSession = await dynamicMocks.getSession()

      expect(renewedSession.expiresAt > createdSession.expiresAt).toBe(true)
      expect(renewedSession.updatedAt! > createdSession.updatedAt!).toBe(true)

      // Set-Cookie assertions
      const setCookie = setCookieParser(response, { map: true })

      expect(setCookie.session_id).toEqual({
        name: 'session_id',
        value: renewedSession.token,
        maxAge: SessionService.EXPIRATION_IN_MILLISECONDS / 1000,
        path: '/',
        httpOnly: true,
      })
    })
  })

  describe('Anonymous user', () => {
    it('Without "session_id" cookie', async () => {
      const response = await fetch(api('/v1/user'))

      expect(response.status).toBe(401)

      const body = await response.json()

      expect(body).toEqual({
        statusCode: 401,
        message: 'Session is invalid or has expired',
        data: {
          code: 'UNAUTHORIZED',
        },
      })
    })

    it('With unknown "session_id" token', async () => {
      const response = await fetch(api('/v1/user'), {
        headers: {
          Cookie: `session_id=${'a'.repeat(96)}`,
        },
      })

      expect(response.status).toBe(401)

      const body = await response.json()

      expect(body).toEqual({
        statusCode: 401,
        message: 'Session is invalid or has expired',
        data: {
          code: 'UNAUTHORIZED',
        },
      })
    })

    it('With expired session', async () => {
      vi.useFakeTimers({
        now: new Date(Date.now() - SessionService.EXPIRATION_IN_MILLISECONDS),
      })

      const expiredSession = await dynamicMocks.createSession(
        {
          userId: createdUser.id,
          token: 'b'.repeat(96),
        },
        { merge: true },
      )

      const response = await fetch(api('/v1/user'), {
        headers: {
          Cookie: `session_id=${expiredSession.token}`,
        },
      })

      expect(response.status).toBe(401)

      const body = await response.json()

      expect(body).toEqual({
        statusCode: 401,
        message: 'Session is invalid or has expired',
        data: {
          code: 'UNAUTHORIZED',
        },
      })
    })
  })
})
