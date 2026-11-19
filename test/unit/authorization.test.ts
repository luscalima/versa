import {
  authorize,
  hasPermission,
  hasPermissions,
} from '#server/modules/authorization/authorization'
import { Permission } from '#server/modules/authorization/permissions'
import { AnonymousUser, type UserContext } from '#server/modules/users/user'

const user: UserContext = {
  id: 'user-id',
  username: 'JohnDoe',
  email: 'john.doe@example.com',
  permissions: [Permission.READ_USERS, Permission.CREATE_SESSIONS],
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
      expect(hasPermission(user, Permission.READ_USERS)).toBe(true)
    })

    it('returns false when the user does not own the permission', () => {
      expect(hasPermission(user, Permission.UPDATE_USERS)).toBe(false)
    })
  })

  describe('hasPermissions()', () => {
    it('returns true for an empty permission list', () => {
      expect(hasPermissions(user, [])).toBe(true)
    })

    it('requires every permission in "all" mode', () => {
      expect(hasPermissions(user, [Permission.READ_USERS, Permission.CREATE_SESSIONS])).toBe(true)
      expect(hasPermissions(user, [Permission.READ_USERS, Permission.UPDATE_USERS])).toBe(false)
    })

    it('accepts at least one permission in "any" mode', () => {
      expect(hasPermissions(user, [Permission.READ_USERS, Permission.UPDATE_USERS], 'any')).toBe(
        true,
      )
      expect(
        hasPermissions(user, [Permission.READ_ACTIVATION_TOKEN, Permission.UPDATE_USERS], 'any'),
      ).toBe(false)
    })
  })

  describe('authorize()', () => {
    it('returns the user when authorized', () => {
      const result = authorize(user, [Permission.READ_USERS])

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe(user)
    })

    it('rejects anonymous users as unauthorized', () => {
      const result = authorize(new AnonymousUser(), [Permission.READ_USERS])

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr().statusCode).toBe(401)
    })

    it('rejects users missing permissions as forbidden and reports them', () => {
      const result = authorize(user, [Permission.READ_USERS, Permission.UPDATE_USERS])

      expect(result.isErr()).toBe(true)

      const error = result._unsafeUnwrapErr()

      expect(error.statusCode).toBe(403)
      expect(error.data).toEqual({
        code: 'ACCESS_DENIED',
        missing: [Permission.UPDATE_USERS],
      })
    })
  })
})
