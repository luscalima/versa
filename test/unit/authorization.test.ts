import {
  authorize,
  can,
  hasPermission,
  hasPermissions,
} from '#server/modules/authorization/authorization'
import { isPermission, Permissions } from '#server/modules/authorization/permissions'
import { AnonymousUser, User, type UserContext } from '#server/modules/users/user'

const user: UserContext = {
  id: 'user-id',
  username: 'JohnDoe',
  email: 'john.doe@example.com',
  permissions: [Permissions.READ_USER, Permissions.CREATE_SESSION],
  isAnonymous: false,
}

function createUserResource(id = user.id): User {
  return User.fromPersistence({
    id,
    username: 'JohnDoe',
    email: 'john.doe@example.com',
    password: 'Password123!',
    permissions: [],
  })
}

describe('authorization', () => {
  beforeAll(() => {
    vi.stubGlobal('createError', (options: Record<string, unknown>) =>
      Object.assign(new Error(String(options.message)), options),
    )
  })

  describe('hasPermission()', () => {
    it('returns true when the user owns the permission', () => {
      expect(hasPermission(user, Permissions.READ_USER)).toBe(true)
    })

    it('returns false when the user does not own the permission', () => {
      expect(hasPermission(user, Permissions.UPDATE_USER)).toBe(false)
    })
  })

  describe('hasPermissions()', () => {
    it('returns true for an empty permission list', () => {
      expect(hasPermissions(user, [])).toBe(true)
    })

    it('requires every permission in "all" mode', () => {
      expect(hasPermissions(user, [Permissions.READ_USER, Permissions.CREATE_SESSION])).toBe(true)
      expect(hasPermissions(user, [Permissions.READ_USER, Permissions.UPDATE_USER])).toBe(false)
    })

    it('accepts at least one permission in "any" mode', () => {
      expect(hasPermissions(user, [Permissions.READ_USER, Permissions.UPDATE_USER], 'any')).toBe(
        true,
      )
      expect(
        hasPermissions(user, [Permissions.READ_ACTIVATION_TOKEN, Permissions.UPDATE_USER], 'any'),
      ).toBe(false)
    })
  })

  describe('authorize()', () => {
    it('returns the user when authorized', () => {
      const result = authorize(user, [Permissions.READ_USER])

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe(user)
    })

    it('rejects anonymous users as unauthorized', () => {
      const result = authorize(new AnonymousUser(), [Permissions.READ_USER])

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr().statusCode).toBe(401)
    })

    it('rejects users missing permissions as forbidden and reports them', () => {
      const result = authorize(user, [Permissions.READ_USER, Permissions.UPDATE_USER])

      expect(result.isErr()).toBe(true)

      const error = result._unsafeUnwrapErr()

      expect(error.statusCode).toBe(403)
      expect(error.data).toEqual({
        code: 'ACCESS_DENIED',
        missing: [Permissions.UPDATE_USER],
      })
    })
  })

  describe('can()', () => {
    it('allows when the user has the permission and the policy approves', () => {
      const subject: UserContext = {
        ...user,
        permissions: [...user.permissions, Permissions.UPDATE_USER],
      }
      const result = can(Permissions.UPDATE_USER, {
        subject,
        resource: createUserResource(),
      })

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('rejects when the policy denies', () => {
      const subject: UserContext = {
        ...user,
        permissions: [...user.permissions, Permissions.UPDATE_USER],
      }
      const result = can(Permissions.UPDATE_USER, {
        subject,
        resource: createUserResource('another-id'),
      })

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr().statusCode).toBe(403)
      expect(result._unsafeUnwrapErr().data).toEqual({
        code: 'ACCESS_DENIED',
        missing: [Permissions.UPDATE_USER],
      })
    })

    it('requires the static permission even when the policy approves', () => {
      const subject: UserContext = {
        ...user,
        permissions: [],
      }
      const result = can(Permissions.UPDATE_USER, {
        subject,
        resource: createUserResource(),
      })

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr().statusCode).toBe(403)
      expect(result._unsafeUnwrapErr().data).toEqual({
        code: 'ACCESS_DENIED',
        missing: [Permissions.UPDATE_USER],
      })
    })

    it('allows when there is no policy for the permission', () => {
      const result = can(Permissions.READ_USER, {
        subject: user,
        resource: createUserResource(),
      })

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('rejects anonymous subjects as unauthorized', () => {
      const result = can(Permissions.UPDATE_USER, {
        subject: new AnonymousUser(),
        resource: createUserResource(),
      })

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr().statusCode).toBe(401)
    })

    it('allows when at least one permission passes in "any" mode', () => {
      const subject: UserContext = {
        ...user,
        permissions: [Permissions.READ_USER],
      }

      const result = can(
        [Permissions.UPDATE_USER, Permissions.READ_USER],
        { subject, resource: createUserResource('another-id') },
        'any',
      )

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('requires every permission to pass in "all" mode', () => {
      const subject: UserContext = {
        ...user,
        permissions: [...user.permissions, Permissions.UPDATE_USER],
      }

      const allowed = can(
        [Permissions.UPDATE_USER, Permissions.READ_USER],
        { subject, resource: createUserResource() },
        'all',
      )
      const denied = can(
        [Permissions.UPDATE_USER, Permissions.READ_USER],
        { subject, resource: createUserResource('another-id') },
        'all',
      )

      expect(allowed.isOk()).toBe(true)
      expect(denied.isErr()).toBe(true)
      expect(denied._unsafeUnwrapErr().statusCode).toBe(403)
    })
  })

  describe('migration permissions', () => {
    it('exposes "read:migration"', () => {
      expect(Permissions.READ_MIGRATION).toBe('read:migration')
    })

    it('exposes "run:migration"', () => {
      expect(Permissions.RUN_MIGRATION).toBe('run:migration')
    })

    it('recognizes both as valid permissions', () => {
      expect(isPermission('read:migration')).toBe(true)
      expect(isPermission('run:migration')).toBe(true)
    })
  })

  describe('UPDATE_USER_OTHERS permission', () => {
    it('is exposed as "update:user:others"', () => {
      expect(Permissions.UPDATE_USER_OTHERS).toBe('update:user:others')
    })

    it('is recognized as a valid permission', () => {
      expect(isPermission('update:user:others')).toBe(true)
    })

    it('allows updating any user when the subject owns the permission', () => {
      const subject: UserContext = {
        ...user,
        permissions: [...user.permissions, Permissions.UPDATE_USER_OTHERS],
      }

      const result = can(Permissions.UPDATE_USER_OTHERS, {
        subject,
        resource: createUserResource('another-id'),
      })

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('rejects subjects that do not own the permission', () => {
      const result = can(Permissions.UPDATE_USER_OTHERS, {
        subject: user,
        resource: createUserResource('another-id'),
      })

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr().statusCode).toBe(403)
      expect(result._unsafeUnwrapErr().data).toEqual({
        code: 'ACCESS_DENIED',
        missing: [Permissions.UPDATE_USER_OTHERS],
      })
    })
  })
})
