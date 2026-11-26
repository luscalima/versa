import { fetch } from 'ofetch'
import {
  api,
  clearDatabase,
  destroyDatabase,
  dynamicMocks,
  getDatabase,
  restoreDatabase,
} from '#test/helpers'
import { Permissions } from '#server/modules/authorization/permissions'
import type { SessionProps } from '#server/modules/sessions/session'

describe('POST /v1/migrations', async () => {
  let authorizedSession: SessionProps
  let forbiddenSession: SessionProps

  function runMigrations(token?: string) {
    return fetch(api('/v1/migrations'), {
      method: 'POST',
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
    it('Rejects the request without running any migration', async () => {
      const response = await runMigrations()

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({
        statusCode: 401,
        message: 'Session is invalid or has expired',
        data: {
          code: 'UNAUTHORIZED',
        },
      })

      const db = await getDatabase()

      expect(await db.schema.hasTable('users')).toBe(false)
      expect(await db.schema.hasTable('sessions')).toBe(false)
    })
  })

  describe('Authenticated user', () => {
    const pendingMigration = '20261107174643_create_user_activation_tokens.ts'
    const forbiddenBody = {
      statusCode: 403,
      message: 'You do not have permission to perform this action',
      data: {
        code: 'ACCESS_DENIED',
        missing: [Permissions.RUN_MIGRATION],
      },
    }

    beforeAll(async () => {
      await restoreDatabase()

      const db = await getDatabase()

      await db.schema.dropTable('user_activation_tokens')
      await db('knex_migrations').where({ name: pendingMigration }).del()

      const authorized = await dynamicMocks.createActivatedUserWithSession({
        username: 'MigrationRunner',
        email: 'migration.runner@example.com',
        token: 'c'.repeat(96),
        extraPermissions: [Permissions.RUN_MIGRATION],
      })
      authorizedSession = authorized.session

      const forbidden = await dynamicMocks.createActivatedUserWithSession({
        username: 'NoMigrationRunner',
        email: 'no.migration.runner@example.com',
        token: 'd'.repeat(96),
      })
      forbiddenSession = forbidden.session
    })

    it('Rejects a user without "RUN_MIGRATION" permission', async () => {
      const response = await runMigrations(forbiddenSession.token)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual(forbiddenBody)

      const db = await getDatabase()

      expect(await db.schema.hasTable('user_activation_tokens')).toBe(false)
    })

    it('Runs pending migrations for a user with "RUN_MIGRATION" permission', async () => {
      const response = await runMigrations(authorizedSession.token)

      expect(response.status).toBe(201)

      const body = await response.json()

      expect(Array.isArray(body.completed)).toBe(true)
      expect(body.completed).toEqual([pendingMigration])
    })

    it('Returns no completed migrations when there is nothing pending', async () => {
      const response = await runMigrations(authorizedSession.token)

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(Array.isArray(body.completed)).toBe(true)
      expect(body.completed).toHaveLength(0)
    })
  })
})
