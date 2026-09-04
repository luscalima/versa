import { fetch } from 'ofetch'
import { api, clearDatabase, destroyDatabase, restoreDatabase } from '#test/helpers'

describe('GET /v1/users/:username', async () => {
  const username = 'JohnDoe'
  const userPayload = {
    username,
    email: 'john.doe@example.com',
    password: 'Password123!',
  }

  beforeAll(async () => {
    await clearDatabase()
    await restoreDatabase()
    await fetch(api('/v1/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload),
    })
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  describe('Anonymous user', () => {
    it('With exact username match', async () => {
      const response = await fetch(api(`/v1/users/${username}`))

      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data).toEqual({
        username: userPayload.username,
        email: userPayload.email,
      })
    })

    it('With username case-insensitive match', async () => {
      const response = await fetch(api(`/v1/users/${username.toLowerCase()}`))

      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data).toEqual({
        username: userPayload.username,
        email: userPayload.email,
      })
    })

    it('With non-existing username', async () => {
      const nonExistingUsername = 'NonExistingUser'
      const response = await fetch(api(`/v1/users/${nonExistingUsername}`))

      expect(response.status).toBe(404)

      const data = await response.json()

      expect(data).toEqual({
        status_code: 404,
        message: `User with username '${nonExistingUsername}' not found`,
        data: {
          code: 'USER_NOT_FOUND',
        },
      })
    })
  })
})
