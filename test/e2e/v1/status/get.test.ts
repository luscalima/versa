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
      extraPermissions: [Permissions.READ_STATUS_ALL],
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
    it('Returns only the public status fields', async () => {
      const response = await requestStatus()

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(new Date(body.updatedAt).toISOString()).toEqual(body.updatedAt)
      expect(body).not.toHaveProperty('database')
    })
  })

  describe('Authenticated user', () => {
    it('Hides the database data from a user without any status permission', async () => {
      const response = await requestStatus(forbiddenSession.token)

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(new Date(body.updatedAt).toISOString()).toEqual(body.updatedAt)
      expect(body).not.toHaveProperty('database')
    })

    it('Hides the database data from a user without "READ_STATUS_ALL" permission', async () => {
      const response = await requestStatus(commonUserSession.token)

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(new Date(body.updatedAt).toISOString()).toEqual(body.updatedAt)
      expect(body).not.toHaveProperty('database')
    })

    it('Returns the database version to a user with "READ_STATUS_ALL" permission', async () => {
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
