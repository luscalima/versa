import { fetch } from 'ofetch'
import { api, clearDatabase, destroyDatabase, dynamicMocks, restoreDatabase } from '#test/helpers'
import type { UserProps } from '#server/modules/users/user'
import type { SessionProps } from '#server/modules/sessions/session'
import setCookieParser from 'set-cookie-parser'
import { SessionService } from '#server/modules/sessions/sessionService'

describe('DELETE /v1/sessions', async () => {
  let user: UserProps
  let createdSession: SessionProps

  beforeEach(async () => {
    user = await dynamicMocks.createUser(null, { rebuild: true })
    createdSession = await dynamicMocks.createSession({ userId: user.id }, { merge: true })
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  async function requestSessionDeletion(token?: string) {
    return fetch(api('/v1/sessions'), {
      method: 'DELETE',
      headers: token ? { Cookie: `session_id=${token}` } : undefined,
    })
  }

  describe('Authenticated user', () => {
    it('With valid "session_id" cookie', async () => {
      const response = await requestSessionDeletion(createdSession.token)

      expect(response.status).toBe(204)

      const deletedSession = await dynamicMocks.getSession(createdSession.token)

      expect(deletedSession.expiresAt < createdSession.expiresAt).toBe(true)
      expect(deletedSession.updatedAt! >= createdSession.updatedAt!).toBe(true)

      const setCookie = setCookieParser(response, { map: true })

      expect(setCookie.session_id).toMatchObject({
        name: 'session_id',
        value: '',
        maxAge: -1,
        path: '/',
      })
    })

    it('Does not delete the sessions of the same user', async () => {
      const otherSession = await dynamicMocks.createSession(
        { userId: user.id, token: 'a'.repeat(96) },
        { merge: true },
      )

      const response = await requestSessionDeletion(createdSession.token)

      expect(response.status).toBe(204)

      const remainingSession = await dynamicMocks.getSession(otherSession.token)

      expect(remainingSession).not.toBeUndefined()
    })
  })

  describe('Anonymous user', () => {
    it('Without "session_id" cookie', async () => {
      const response = await requestSessionDeletion()

      expect(response.status).toBe(401)

      const data = await response.json()

      expect(data).toEqual({
        statusCode: 401,
        message: 'Session is invalid or has expired',
        data: {
          code: 'UNAUTHORIZED',
        },
      })
    })

    it('With unknown "session_id" token', async () => {
      const response = await requestSessionDeletion('b'.repeat(96))

      expect(response.status).toBe(401)

      const data = await response.json()

      expect(data).toEqual({
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
          userId: user.id,
          token: 'c'.repeat(96),
        },
        { merge: true },
      )

      const response = await requestSessionDeletion(expiredSession.token)

      expect(response.status).toBe(401)

      const data = await response.json()

      expect(data).toEqual({
        statusCode: 401,
        message: 'Session is invalid or has expired',
        data: {
          code: 'UNAUTHORIZED',
        },
      })
    })
  })

  describe('With unexpected server errors', async () => {
    it('Database is unavailable', async () => {
      await clearDatabase()
      await destroyDatabase()

      const response = await requestSessionDeletion(createdSession.token)
      const errorResponse = await response.json()

      expect(response.status).toBe(503)
      expect(errorResponse).toEqual({
        statusCode: 503,
        message: 'The operation could not be completed at this time. Please try again later.',
        data: { code: 'INTERNAL_SERVER_ERROR' },
      })

      await restoreDatabase()
    })
  })
})
