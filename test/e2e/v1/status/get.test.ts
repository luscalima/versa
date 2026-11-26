import { fetch } from 'ofetch'
import { api, destroyDatabase, dynamicMocks, rebuildDatabase } from '#test/helpers'
import { Permissions } from '#server/modules/authorization/permissions'
import type { SessionProps } from '#server/modules/sessions/session'

describe('GET /v1/status', async () => {
  let fullAccessSession: SessionProps
  let commonUserSession: SessionProps
  let forbiddenSession: SessionProps

  function requestStatus(token?: string) {
    return fetch(api('/v1/status'), {
      headers: token ? { Cookie: `session_id=${token}` } : undefined,
    })
  }

  beforeAll(async () => {
    await rebuildDatabase()

    const fullAccess = await dynamicMocks.createActivatedUserWithSession({
      username: 'StatusViewer',
      email: 'status.viewer@example.com',
      token: 'a'.repeat(96),
      extraPermissions: [Permissions.READ_STATUS_HIDDEN_FIELDS],
    })
    fullAccessSession = fullAccess.session

    const commonUser = await dynamicMocks.createActivatedUserWithSession({
      username: 'CommonStatusViewer',
      email: 'common.status.viewer@example.com',
      token: 'b'.repeat(96),
    })
    commonUserSession = commonUser.session

    const forbiddenUser = await dynamicMocks.createUser(
      {
        username: 'NoStatusViewer',
        email: 'no.status.viewer@example.com',
        permissions: [
          Permissions.CREATE_SESSION,
          Permissions.READ_SESSION,
          Permissions.UPDATE_USER,
        ],
      },
      { merge: true },
    )
    const forbidden = await dynamicMocks.createSession(
      { userId: forbiddenUser.id, token: 'c'.repeat(96) },
      { merge: true },
    )
    forbiddenSession = forbidden
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  describe('Anonymous user', () => {
    it('Rejects the request', async () => {
      const response = await requestStatus()

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({
        statusCode: 401,
        message: 'Session is invalid or has expired',
        data: {
          code: 'UNAUTHORIZED',
        },
      })
    })
  })

  describe('Authenticated user', () => {
    it('Rejects a user without "READ_STATUS" permission', async () => {
      const response = await requestStatus(forbiddenSession.token)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({
        statusCode: 403,
        message: 'You do not have permission to perform this action',
        data: {
          code: 'ACCESS_DENIED',
          missing: [Permissions.READ_STATUS],
        },
      })
    })

    it('Allows a default activated user to read status but hides the database version', async () => {
      const response = await requestStatus(commonUserSession.token)

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(new Date(body.updatedAt).toISOString()).toEqual(body.updatedAt)
      expect(body.database).not.toHaveProperty('version')
      expect(body.database.maxConnections).toBeGreaterThan(0)
      expect(body.database.openedConnections).toBeGreaterThanOrEqual(0)
    })

    it('Returns the database version to a user with "READ_STATUS_HIDDEN_FIELDS" permission', async () => {
      const response = await requestStatus(fullAccessSession.token)

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(new Date(body.updatedAt).toISOString()).toEqual(body.updatedAt)
      expect(body.database.version).toBeTypeOf('string')
      expect(body.database.maxConnections).toBeGreaterThan(0)
      expect(body.database.openedConnections).toBeGreaterThanOrEqual(0)
    })
  })
})
