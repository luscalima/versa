import { fetch } from 'ofetch'
import {
  api,
  destroyDatabase,
  downDatabase,
  dynamicMocks,
  staticMocks,
  getDatabase,
  restoreDatabase,
} from '#test/helpers'
import { NativeHasherAdapter } from '#server/infra/adapters/nativeHasherAdapter'
import { KnexUserRepository } from '#server/infra/repositories/knexUserRepository'

describe('PATCH /v1/users/:username', async () => {
  beforeEach(async () => {
    await dynamicMocks.createUser(null, { rebuild: true })
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  async function updateUser(targetUsername: string, payload: Record<string, unknown>) {
    return fetch(api(`/v1/users/${targetUsername}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  describe('Anonymous user', () => {
    describe('Updating a user', async () => {
      it('Updates the "username" only', async () => {
        const newUsername = 'JaneDoe'
        const response = await updateUser(staticMocks.user.username, { username: newUsername })

        expect(response.status).toBe(200)

        const data = await response.json()

        expect(data.username).toBe(newUsername)
        expect(data.email).toBe(staticMocks.user.email)
        expect(data).not.toHaveProperty('password')

        const repository = new KnexUserRepository(await getDatabase())
        const updated = await repository.findByUsername(newUsername)

        expect(updated).not.toBeNull()
      })

      it('Updates the "email" only', async () => {
        const newEmail = 'jane.doe@example.com'
        const response = await updateUser(staticMocks.user.username, { email: newEmail })

        expect(response.status).toBe(200)

        const data = await response.json()

        expect(data.username).toBe(staticMocks.user.username)
        expect(data.email).toBe(newEmail)
        expect(data).not.toHaveProperty('password')
      })

      it('Updates the "password", hashing it on persistence', async () => {
        const newPassword = 'NewPassword456!'
        const response = await updateUser(staticMocks.user.username, { password: newPassword })

        expect(response.status).toBe(200)

        const repository = new KnexUserRepository(await getDatabase())
        const hasher = new NativeHasherAdapter()
        const user = await repository.findByUsername(staticMocks.user.username)
        const fallsBackToPlainText = user.password === newPassword

        expect(fallsBackToPlainText).toBe(false)

        const correctCompareResult = await hasher.compare(newPassword, user.password)
        const oldPasswordCompareResult = await hasher.compare(
          staticMocks.user.password,
          user.password,
        )

        expect(correctCompareResult).toBe(true)
        expect(oldPasswordCompareResult).toBe(false)
      })

      it('Updates multiple fields at once', async () => {
        const newPayload = {
          username: 'JaneDoe',
          email: 'jane.doe@example.com',
        }
        const response = await updateUser(staticMocks.user.username, newPayload)

        expect(response.status).toBe(200)

        const data = await response.json()

        expect(data.username).toBe(newPayload.username)
        expect(data.email).toBe(newPayload.email)
        expect(data).not.toHaveProperty('password')
      })

      it('Normalizes the "email" to lowercase', async () => {
        const mixedCaseEmail = 'JANE.DOE@EXAMPLE.COM'
        const response = await updateUser(staticMocks.user.username, { email: mixedCaseEmail })

        expect(response.status).toBe(200)

        const data = await response.json()

        expect(data.email).toBe(mixedCaseEmail.toLowerCase())
      })
    })

    describe('With a non-existing user', async () => {
      it('Returns not found', async () => {
        const nonExistingUsername = 'NonExistingUser'
        const response = await updateUser(nonExistingUsername, { username: 'NewName' })

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

    describe('With uniqueness conflicts', async () => {
      it('Returns conflict when the "username" is already in use by another user', async () => {
        await dynamicMocks.createUser({ username: 'JaneDoe' }, { merge: true, unique: true })

        const response = await updateUser(staticMocks.user.username, { username: 'JaneDoe' })

        expect(response.status).toBe(409)

        const data = await response.json()

        expect(data).toEqual({
          status_code: 409,
          message: 'This username is already being used by someone else',
          data: {
            code: 'USERNAME_ALREADY_IN_USE',
          },
        })
      })

      it('Returns conflict when the "email" is already in use by another user', async () => {
        await dynamicMocks.createUser({ email: 'jane@example.com' }, { merge: true, unique: true })

        const response = await updateUser(staticMocks.user.username, {
          email: 'jane@example.com',
        })

        expect(response.status).toBe(409)

        const data = await response.json()

        expect(data).toEqual({
          status_code: 409,
          message: 'This email is already being used by someone else',
          data: {
            code: 'EMAIL_ALREADY_IN_USE',
          },
        })
      })

      it('Allows keeping the same "username" and "email" (self)', async () => {
        const response = await updateUser(staticMocks.user.username, {
          username: staticMocks.user.username,
          email: staticMocks.user.email,
        })

        expect(response.status).toBe(200)
      })
    })

    describe('With invalid data', async () => {
      it('Returns bad request for invalid email', async () => {
        const response = await updateUser(staticMocks.user.username, { email: 'invalid-email' })

        expect(response.status).toBe(400)
      })

      it('Returns bad request for empty username', async () => {
        const response = await updateUser(staticMocks.user.username, { username: '' })

        expect(response.status).toBe(400)
      })

      it('Returns bad request for invalid JSON body', async () => {
        const response = await fetch(api(`/v1/users/${staticMocks.user.username}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: '{"username": "JohnDoe"',
        })

        expect(response.status).toBe(400)
      })

      it('Returns bad request for a short password', async () => {
        const response = await updateUser(staticMocks.user.username, { password: 'Short1' })

        expect(response.status).toBe(400)
      })
    })

    describe('With unexpected server errors', async () => {
      it('Returns 503 when the database is unavailable', async () => {
        await downDatabase()

        const response = await updateUser(staticMocks.user.username, { username: 'NewName' })
        const errorResponse = await response.json()

        expect(response.status).toBe(503)
        expect(errorResponse).toEqual({
          status_code: 503,
          message: 'The operation could not be completed at this time. Please try again later.',
          data: { code: 'INTERNAL_SERVER_ERROR' },
        })

        await restoreDatabase()
      })
    })
  })
})
