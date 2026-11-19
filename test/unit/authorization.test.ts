import { authorize, hasResource, hasResources } from '#server/modules/authorization/authorization'
import { Resource } from '#server/modules/authorization/resources'
import { AnonymousUser, type UserContext } from '#server/modules/users/user'

const user: UserContext = {
  id: 'user-id',
  username: 'JohnDoe',
  email: 'john.doe@example.com',
  resources: [Resource.READ_USERS, Resource.CREATE_SESSIONS],
  isAnonymous: false,
}

describe('authorization', () => {
  beforeAll(() => {
    vi.stubGlobal('createError', (options: Record<string, unknown>) =>
      Object.assign(new Error(String(options.message)), options),
    )
  })

  describe('hasResource()', () => {
    it('returns true when the user owns the resource', () => {
      expect(hasResource(user, Resource.READ_USERS)).toBe(true)
    })

    it('returns false when the user does not own the resource', () => {
      expect(hasResource(user, Resource.UPDATE_USERS)).toBe(false)
    })
  })

  describe('hasResources()', () => {
    it('returns true for an empty resource list', () => {
      expect(hasResources(user, [])).toBe(true)
    })

    it('requires every resource in "all" mode', () => {
      expect(hasResources(user, [Resource.READ_USERS, Resource.CREATE_SESSIONS])).toBe(true)
      expect(hasResources(user, [Resource.READ_USERS, Resource.UPDATE_USERS])).toBe(false)
    })

    it('accepts at least one resource in "any" mode', () => {
      expect(hasResources(user, [Resource.READ_USERS, Resource.UPDATE_USERS], 'any')).toBe(true)
      expect(
        hasResources(user, [Resource.READ_ACTIVATION_TOKEN, Resource.UPDATE_USERS], 'any'),
      ).toBe(false)
    })
  })

  describe('authorize()', () => {
    it('returns the user when authorized', () => {
      const result = authorize(user, [Resource.READ_USERS])

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toBe(user)
    })

    it('rejects anonymous users as unauthorized', () => {
      const result = authorize(new AnonymousUser(), [Resource.READ_USERS])

      expect(result.isErr()).toBe(true)
      expect(result._unsafeUnwrapErr().statusCode).toBe(401)
    })

    it('rejects users missing resources as forbidden and reports them', () => {
      const result = authorize(user, [Resource.READ_USERS, Resource.UPDATE_USERS])

      expect(result.isErr()).toBe(true)

      const error = result._unsafeUnwrapErr()

      expect(error.statusCode).toBe(403)
      expect(error.data).toEqual({
        code: 'ACCESS_DENIED',
        missing: [Resource.UPDATE_USERS],
      })
    })
  })
})
