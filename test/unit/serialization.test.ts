import { ActivationToken } from '#server/modules/activation/activationToken'
import type { DatabaseStatus } from '#server/modules/database/database'
import { Permissions } from '#server/modules/authorization/permissions'
import {
  activationTokenSchema,
  serializeActivationToken,
} from '#server/modules/serialization/activation'
import {
  migrationListSchema,
  migrationRunSchema,
  serializeMigrationList,
  serializeMigrationRun,
} from '#server/modules/serialization/migration'
import { serializeSession, sessionResponseSchema } from '#server/modules/serialization/session'
import {
  fullStatusSchema,
  publicStatusSchema,
  serializeFullStatus,
  serializePublicStatus,
  serializeStatusForRequester,
} from '#server/modules/serialization/status'
import {
  contactUserSchema,
  fullUserSchema,
  publicUserSchema,
  serializeContactUser,
  serializeFullUser,
  serializePublicUser,
  serializeUserForRequester,
} from '#server/modules/serialization/user'
import { Session } from '#server/modules/sessions/session'
import { AnonymousUser, User, type UserContext } from '#server/modules/users/user'
import { validateResponse } from '#server/utils/validateResponse'

const createdAt = new Date('2024-01-01T00:00:00.000Z')
const updatedAt = new Date('2024-01-02T00:00:00.000Z')
const expiresAt = new Date('2024-01-03T00:00:00.000Z')
const status: DatabaseStatus = {
  version: '16.0',
  maxConnections: 100,
  openedConnections: 3,
}

function createUser(): User {
  return User.fromPersistence({
    id: 'user-id',
    username: 'JohnDoe',
    email: 'john.doe@example.com',
    password: 'Password123!',
    permissions: [Permissions.READ_USER],
    createdAt,
    updatedAt,
  })
}

function createRequester(id = 'requester-id', permissions: Permissions[] = []): UserContext {
  return {
    id,
    username: 'Requester',
    email: 'requester@example.com',
    permissions,
    isAnonymous: false,
  }
}

describe('serialization', () => {
  beforeAll(() => {
    vi.stubGlobal('createError', (options: Record<string, unknown>) =>
      Object.assign(new Error(String(options.message)), options),
    )
  })

  describe('user serializers', () => {
    it('serializes the public user with only the username', () => {
      const serialized = serializePublicUser(createUser())

      expect(serialized).toEqual({ username: 'JohnDoe' })
      expect(publicUserSchema.safeParse(serialized).success).toBe(true)
      expect(contactUserSchema.safeParse(serialized).success).toBe(false)
    })

    it('serializes the contact user with username and email', () => {
      const serialized = serializeContactUser(createUser())

      expect(serialized).toEqual({ username: 'JohnDoe', email: 'john.doe@example.com' })
      expect(contactUserSchema.safeParse(serialized).success).toBe(true)
      expect(publicUserSchema.safeParse(serialized).success).toBe(false)
    })

    it('serializes the full user with ISO dates and without password', () => {
      const serialized = serializeFullUser(createUser())

      expect(serialized).toEqual({
        id: 'user-id',
        username: 'JohnDoe',
        email: 'john.doe@example.com',
        permissions: [Permissions.READ_USER],
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      })
      expect(serialized).not.toHaveProperty('password')
      expect(fullUserSchema.safeParse(serialized).success).toBe(true)
    })

    it('selects the contact audience for the user themself', () => {
      const result = serializeUserForRequester(createUser(), createRequester('user-id'))

      expect(result.schema).toBe(contactUserSchema)
      expect(result.data).toEqual({ username: 'JohnDoe', email: 'john.doe@example.com' })
    })

    it('selects the contact audience for a reader', () => {
      const result = serializeUserForRequester(
        createUser(),
        createRequester('requester-id', [Permissions.READ_USER]),
      )

      expect(result.schema).toBe(contactUserSchema)
    })

    it('selects the public audience for everyone else', () => {
      const result = serializeUserForRequester(createUser(), new AnonymousUser())

      expect(result.schema).toBe(publicUserSchema)
      expect(result.data).toEqual({ username: 'JohnDoe' })
    })
  })

  describe('status serializers', () => {
    it('serializes the public status with only the timestamp', () => {
      const serialized = serializePublicStatus(updatedAt)

      expect(serialized).toEqual({ updatedAt: updatedAt.toISOString() })
      expect(publicStatusSchema.safeParse(serialized).success).toBe(true)
      expect(fullStatusSchema.safeParse(serialized).success).toBe(false)
    })

    it('serializes the full status with database data', () => {
      const serialized = serializeFullStatus(status, updatedAt)

      expect(serialized).toEqual({
        updatedAt: updatedAt.toISOString(),
        database: status,
      })
      expect(fullStatusSchema.safeParse(serialized).success).toBe(true)
    })

    it('selects the full audience with READ_STATUS_ALL', () => {
      const result = serializeStatusForRequester(
        status,
        createRequester('requester-id', [Permissions.READ_STATUS_ALL]),
        updatedAt,
      )

      expect(result.schema).toBe(fullStatusSchema)
      expect(result.data.database).toEqual(status)
    })

    it('selects the public audience without READ_STATUS_ALL', () => {
      const result = serializeStatusForRequester(status, new AnonymousUser(), updatedAt)

      expect(result.schema).toBe(publicStatusSchema)
      expect(result.data).toEqual({ updatedAt: updatedAt.toISOString() })
    })
  })

  describe('activation serializers', () => {
    it('serializes the token with ISO dates and nullable usedAt', () => {
      const token = ActivationToken.fromPersistence({
        id: 'token-id',
        userId: 'user-id',
        usedAt: null,
        expiresAt,
        createdAt,
        updatedAt,
      })
      const serialized = serializeActivationToken(token)

      expect(serialized).toEqual({
        id: 'token-id',
        userId: 'user-id',
        usedAt: null,
        expiresAt: expiresAt.toISOString(),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      })
      expect(activationTokenSchema.safeParse(serialized).success).toBe(true)
    })
  })

  describe('session serializers', () => {
    it('serializes the session with ISO dates', () => {
      const session = Session.create({
        id: 'session-id',
        token: 'session-token',
        userId: 'user-id',
        expiresAt,
        createdAt,
        updatedAt,
      })
      const serialized = serializeSession(session)

      expect(serialized).toEqual({
        id: 'session-id',
        token: 'session-token',
        userId: 'user-id',
        expiresAt: expiresAt.toISOString(),
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      })
      expect(sessionResponseSchema.safeParse(serialized).success).toBe(true)
    })
  })

  describe('migration serializers', () => {
    it('serializes the migration list', () => {
      const serialized = serializeMigrationList({ completed: ['001'], pending: ['002'] })

      expect(serialized).toEqual({ completed: ['001'], pending: ['002'] })
      expect(migrationListSchema.safeParse(serialized).success).toBe(true)
    })

    it('serializes the migration run result', () => {
      const serialized = serializeMigrationRun({ completed: ['001'] })

      expect(serialized).toEqual({ completed: ['001'] })
      expect(migrationRunSchema.safeParse(serialized).success).toBe(true)
      expect(migrationListSchema.safeParse(serialized).success).toBe(false)
    })
  })

  describe('validateResponse()', () => {
    it('returns the parsed data when the response matches the schema', () => {
      expect(validateResponse(publicUserSchema, { username: 'JohnDoe' })).toEqual({
        username: 'JohnDoe',
      })
    })

    it('throws an internal error when the response has unexpected fields', () => {
      expect(() =>
        validateResponse(publicUserSchema, { username: 'JohnDoe', email: 'john.doe@example.com' }),
      ).toThrow()

      try {
        validateResponse(publicUserSchema, { username: 'JohnDoe', email: 'john.doe@example.com' })
      } catch (error) {
        expect((error as { statusCode?: number }).statusCode).toBe(500)
      }
    })
  })
})
