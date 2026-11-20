import {
  authorize,
  hasPermission,
  hasPermissions,
} from '#server/modules/authorization/authorization'
import { Permissions } from '#server/modules/authorization/permissions'
import { AnonymousUser, type UserContext } from '#server/modules/users/user'

const user: UserContext = {
  id: 'user-id',
  username: 'JohnDoe',
  email: 'john.doe@example.com',
  permissions: [Permissions.READ_USER, Permissions.CREATE_SESSION],
  isAnonymous: false,
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
})
