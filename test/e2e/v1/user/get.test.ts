import { fetch } from 'ofetch'
import { api, destroyDatabase, dynamicMocks, sessionRepository } from '#test/helpers'
import type { UserProps } from '#server/modules/users/user'
import { version as uuidVersion } from 'uuid'
import type { SessionProps } from '#server/modules/sessions/session'
import { SessionService } from '#server/modules/sessions/sessionService'
import setCookieParser from 'set-cookie-parser'
import type { Permissions } from '#server/modules/authorization/permissions'
import { Permissions as PermissionValue } from '#server/modules/authorization/permissions'

type SeededUser = UserProps & { permissions: Permissions[] }

describe('GET /v1/user', async () => {
  let createdUser: SeededUser
  let createdSession: SessionProps
  let userWithoutSessionRead: SeededUser
  let sessionWithoutSessionRead: SessionProps
  let inactiveUser: SeededUser
  let inactiveSession: SessionProps

  function requestWithSession(token: string) {
    return fetch(api('/v1/user'), {
      headers: { Cookie: `session_id=${token}` },
    })
  }

  beforeAll(async () => {
    vi.useFakeTimers({
      now: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    })

    createdUser = await dynamicMocks.createUser(
      {
        permissions: [
          PermissionValue.CREATE_SESSION,
          PermissionValue.READ_SESSION,
          PermissionValue.UPDATE_USER,
        ],
      },
      { merge: true, rebuild: true },
    )
    createdSession = await dynamicMocks.createSession({ userId: createdUser.id }, { merge: true })

    userWithoutSessionRead = await dynamicMocks.createUser(
      {
        username: 'NoSessionRead',
        email: 'no.session.read@example.com',
        permissions: [PermissionValue.READ_USER, PermissionValue.CREATE_SESSION],
      },
      { merge: true },
    )
    sessionWithoutSessionRead = await dynamicMocks.createSession(
      { userId: userWithoutSessionRead.id, token: 'c'.repeat(96) },
      { merge: true },
    )

    inactiveUser = await dynamicMocks.createUser(
      {
        username: 'InactiveUser',
        email: 'inactive.user@example.com',
        permissions: [PermissionValue.READ_ACTIVATION_TOKEN],
      },
      { merge: true },
    )
    inactiveSession = await dynamicMocks.createSession(
      { userId: inactiveUser.id, token: 'd'.repeat(96) },
      { merge: true },
    )
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  describe('Default user', () => {
    it('With valid session', async () => {
      const response = await requestWithSession(createdSession.token)

      expect(response.status).toBe(200)

      const userData = await response.json()

      expect(userData).toEqual({
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        permissions: [
          PermissionValue.CREATE_SESSION,
          PermissionValue.READ_SESSION,
          PermissionValue.UPDATE_USER,
        ],
        createdAt: createdUser.createdAt?.toISOString(),
        updatedAt: createdUser.updatedAt?.toISOString(),
      })

      expect(uuidVersion(userData.id)).toBe(4)

      // Session renewal assertions
      const sessionRepo = await sessionRepository()
      const renewedSession = await sessionRepo.findValid(createdSession.token)

      expect(renewedSession).not.toBeNull()
      expect(renewedSession!.expiresAt > createdSession.expiresAt).toBe(true)
      expect(renewedSession!.updatedAt! > createdSession.updatedAt!).toBe(true)

      // Set-Cookie assertions
      const setCookie = setCookieParser(response, { map: true })

      expect(setCookie.session_id).toEqual({
        name: 'session_id',
        value: renewedSession!.token,
        maxAge: SessionService.EXPIRATION_IN_MILLISECONDS / 1000,
        path: '/',
        httpOnly: true,
      })
    })
  })

  describe('Authenticated user without "READ_SESSION"', () => {
    const forbiddenBody = {
      statusCode: 403,
      message: 'You do not have permission to perform this action',
      data: {
        code: 'ACCESS_DENIED',
        missing: [PermissionValue.READ_SESSION],
      },
    }

    it('Rejects a user whose permissions do not include "READ_SESSION"', async () => {
      const response = await requestWithSession(sessionWithoutSessionRead.token)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual(forbiddenBody)
    })

    it('Rejects an inactive user that still holds "READ_ACTIVATION_TOKEN"', async () => {
      const response = await requestWithSession(inactiveSession.token)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual(forbiddenBody)
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
      const response = await requestWithSession('a'.repeat(96))

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

      const response = await requestWithSession(expiredSession.token)

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
