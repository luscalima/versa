import { fetch } from 'ofetch'
import type { SeededUser } from '#test/helpers'
import { api, destroyDatabase, dynamicMocks } from '#test/helpers'
import { Permissions } from '#server/modules/authorization/permissions'
import type { SessionProps } from '#server/modules/sessions/session'

describe('GET /v1/users/:username', async () => {
  const username = 'JohnDoe'
  const userPayload = {
    username,
    email: 'john.doe@example.com',
  }

  let target: SeededUser
  let selfSession: SessionProps
  let readerSession: SessionProps
  let plainSession: SessionProps

  function requestUser(session?: SessionProps) {
    return fetch(api(`/v1/users/${username}`), {
      headers: session ? { Cookie: `session_id=${session.token}` } : undefined,
    })
  }

  beforeAll(async () => {
    target = await dynamicMocks.createUser(null, { rebuild: true })
    selfSession = await dynamicMocks.createSession(
      { userId: target.id, token: 'a'.repeat(96) },
      { merge: true },
    )

    const reader = await dynamicMocks.createActivatedUserWithSession({
      username: 'Reader',
      email: 'reader@example.com',
      token: 'b'.repeat(96),
      extraPermissions: [Permissions.READ_USER],
    })
    readerSession = reader.session

    const plain = await dynamicMocks.createActivatedUserWithSession({
      username: 'Plain',
      email: 'plain@example.com',
      token: 'c'.repeat(96),
    })
    plainSession = plain.session
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  describe('Anonymous user', () => {
    it('With exact username match returns only the username', async () => {
      const response = await requestUser()

      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data).toEqual({
        username: userPayload.username,
      })
    })

    it('With username case-insensitive match returns only the username', async () => {
      const response = await fetch(api(`/v1/users/${username.toLowerCase()}`))

      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data).toEqual({
        username: userPayload.username,
      })
    })

    it('With non-existing username', async () => {
      const nonExistingUsername = 'NonExistingUser'
      const response = await fetch(api(`/v1/users/${nonExistingUsername}`))

      expect(response.status).toBe(404)

      const data = await response.json()

      expect(data).toEqual({
        statusCode: 404,
        message: `User with username '${nonExistingUsername}' not found`,
        data: {
          code: 'USER_NOT_FOUND',
        },
      })
    })
  })

  describe('Authenticated user', () => {
    it('Returns the email to the user themself', async () => {
      const response = await requestUser(selfSession)

      expect(response.status).toBe(200)

      expect(await response.json()).toEqual({
        username: userPayload.username,
        email: userPayload.email,
      })
    })

    it('Returns the email to a user with "READ_USER" permission', async () => {
      const response = await requestUser(readerSession)

      expect(response.status).toBe(200)

      expect(await response.json()).toEqual({
        username: userPayload.username,
        email: userPayload.email,
      })
    })

    it('Hides the email from a user without "READ_USER" permission', async () => {
      const response = await requestUser(plainSession)

      expect(response.status).toBe(200)

      expect(await response.json()).toEqual({
        username: userPayload.username,
      })
    })
  })
})
