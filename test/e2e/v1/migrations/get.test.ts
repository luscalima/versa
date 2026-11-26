import { fetch } from 'ofetch'
import { api, clearDatabase, destroyDatabase, dynamicMocks, restoreDatabase } from '#test/helpers'
import { Permissions } from '#server/modules/authorization/permissions'
import type { SessionProps } from '#server/modules/sessions/session'

describe('GET /v1/migrations', async () => {
  let authorizedSession: SessionProps
  let forbiddenSession: SessionProps

  function requestMigrations(token?: string) {
    return fetch(api('/v1/migrations'), {
      headers: token ? { Cookie: `session_id=${token}` } : undefined,
    })
  }

  beforeAll(async () => {
    await clearDatabase()
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  describe('Anonymous user', () => {
    it('Rejects the request', async () => {
      const response = await requestMigrations()

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
    const forbiddenBody = {
      statusCode: 403,
      message: 'You do not have permission to perform this action',
      data: {
        code: 'ACCESS_DENIED',
        missing: [Permissions.READ_MIGRATION],
      },
    }

    beforeAll(async () => {
      await restoreDatabase()

      const authorized = await dynamicMocks.createActivatedUserWithSession({
        username: 'MigrationReader',
        email: 'migration.reader@example.com',
        token: 'a'.repeat(96),
        extraPermissions: [Permissions.READ_MIGRATION],
      })
      authorizedSession = authorized.session

      const forbidden = await dynamicMocks.createActivatedUserWithSession({
        username: 'NoMigrationReader',
        email: 'no.migration.reader@example.com',
        token: 'b'.repeat(96),
      })
      forbiddenSession = forbidden.session
    })

    it('Rejects a user without "READ_MIGRATION" permission', async () => {
      const response = await requestMigrations(forbiddenSession.token)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual(forbiddenBody)
    })

    it('Retrieves migrations for a user with "READ_MIGRATION" permission', async () => {
      const response = await requestMigrations(authorizedSession.token)

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(Array.isArray(body.completed)).toBe(true)
      expect(Array.isArray(body.pending)).toBe(true)
      expect(body.completed.length).toBeGreaterThan(0)
      expect(body.pending).toHaveLength(0)
    })
  })
})
