import { fetch } from 'ofetch'
import type { SeededUser } from '#test/helpers'
import { api, destroyDatabase, dynamicMocks, staticMocks, userRepository } from '#test/helpers'
import { NativeHasherAdapter } from '#server/infra/adapters/nativeHasherAdapter'
import { Permissions } from '#server/modules/authorization/permissions'

describe('PATCH /v1/users/:username', async () => {
  let sessionToken: string | undefined
  let requester: SeededUser

  beforeEach(async () => {
    sessionToken = undefined
    await dynamicMocks.createUser(null, { rebuild: true })
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  async function updateUser(targetUsername: string, payload: Record<string, unknown>) {
    return fetch(api(`/v1/users/${targetUsername}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Cookie: `session_id=${sessionToken}` } : {}),
      },
      body: JSON.stringify(payload),
    })
  }

  function updateSelf(payload: Record<string, unknown>) {
    return updateUser(requester.username, payload)
  }

  describe('Anonymous user', () => {
    it('Cannot update a user', async () => {
      const newUsername = 'JaneDoe'
      const response = await updateUser(staticMocks.user.username, { username: newUsername })

      expect(response.status).toBe(401)

      const data = await response.json()

      expect(data).toEqual({
        statusCode: 401,
        message: 'Session is invalid or has expired',
        data: {
          code: 'UNAUTHORIZED',
        },
      })
    })
  })

  describe('Authenticated user', () => {
    beforeEach(async () => {
      const { user, session } = await dynamicMocks.createActivatedUserWithSession({
        username: 'ActivatedRequester',
        email: 'activated.requester@example.com',
        extraPermissions: [Permissions.READ_USER],
        token: 'a'.repeat(96),
      })

      requester = user
      sessionToken = session.token
    })

    describe('Updating a user', async () => {
      it('Updates the "username" only', async () => {
        const newUsername = 'JaneDoe'
        const response = await updateSelf({ username: newUsername })

        expect(response.status).toBe(200)

        const data = await response.json()

        expect(data.username).toBe(newUsername)
        expect(data.email).toBe(requester.email)
        expect(data).not.toHaveProperty('password')

        const repository = await userRepository()
        const updated = await repository.findByUsername(newUsername)

        expect(updated).not.toBeNull()
      })

      it('Updates the "email" only', async () => {
        const newEmail = 'jane.doe@example.com'
        const response = await updateSelf({ email: newEmail })

        expect(response.status).toBe(200)

        const data = await response.json()

        expect(data.username).toBe(requester.username)
        expect(data.email).toBe(newEmail)
        expect(data).not.toHaveProperty('password')
      })

      it('Ignores attempts to update "permissions"', async () => {
        const response = await updateSelf({
          permissions: [Permissions.READ_USER, Permissions.CREATE_SESSION],
        })

        expect(response.status).toBe(200)

        const data = await response.json()

        expect(data.permissions).toEqual(requester.permissions)
        expect(data.username).toBe(requester.username)
        expect(data.email).toBe(requester.email)
        expect(data).not.toHaveProperty('password')

        const repository = await userRepository()
        const user = await repository.findByUsername(requester.username)

        expect(user!.toDTO()).toMatchObject({ permissions: requester.permissions })
      })

      it('Keeps the existing "permissions" when not provided', async () => {
        const response = await updateSelf({ username: 'JaneDoe' })

        expect(response.status).toBe(200)

        const data = await response.json()

        expect(data.permissions).toEqual(requester.permissions)
      })

      it('Updates the "password", hashing it on persistence', async () => {
        const newPassword = 'NewPassword456!'
        const response = await updateSelf({ password: newPassword })

        expect(response.status).toBe(200)

        const repository = await userRepository()
        const hasher = new NativeHasherAdapter()
        const user = (await repository.findByUsername(requester.username))!
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
        const response = await updateSelf(newPayload)

        expect(response.status).toBe(200)

        const data = await response.json()

        expect(data.username).toBe(newPayload.username)
        expect(data.email).toBe(newPayload.email)
        expect(data).not.toHaveProperty('password')
      })

      it('Normalizes the "email" to lowercase', async () => {
        const mixedCaseEmail = 'JANE.DOE@EXAMPLE.COM'
        const response = await updateSelf({ email: mixedCaseEmail })

        expect(response.status).toBe(200)

        const data = await response.json()

        expect(data.email).toBe(mixedCaseEmail.toLowerCase())
      })
    })

    describe('Updating another user', () => {
      async function expectUpdateToBeRejected(
        targetUsername: string,
        payload: Record<string, unknown>,
      ) {
        const repository = await userRepository()
        const before = await repository.findByUsername(targetUsername)

        expect(before).not.toBeNull()

        const response = await updateUser(targetUsername, payload)

        expect(response.status).toBe(403)

        const after = await repository.findByUsername(targetUsername)

        expect(after!.toDTO()).toEqual(before!.toDTO())
      }

      it('Rejects updating an inactive user', async () => {
        await expectUpdateToBeRejected(staticMocks.user.username, { username: 'JaneDoe' })
      })

      it('Rejects updating an activated user', async () => {
        const target = await dynamicMocks.createUser(
          {
            username: 'ActivatedTarget',
            email: 'activated.target@example.com',
            permissions: [
              Permissions.CREATE_SESSION,
              Permissions.READ_SESSION,
              Permissions.UPDATE_USER,
            ],
          },
          { merge: true },
        )

        await expectUpdateToBeRejected(target.username, { email: 'new.email@example.com' })
      })
    })

    describe('With a non-existing user', async () => {
      it('Returns not found', async () => {
        const nonExistingUsername = 'NonExistingUser'
        const response = await updateUser(nonExistingUsername, { username: 'NewName' })

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

    describe('With uniqueness conflicts', async () => {
      it('Returns conflict when the "username" is already in use by another user', async () => {
        await dynamicMocks.createUser({ username: 'JaneDoe' }, { merge: true, unique: true })

        const response = await updateSelf({ username: 'JaneDoe' })

        expect(response.status).toBe(409)

        const data = await response.json()

        expect(data).toEqual({
          statusCode: 409,
          message: 'This username is already being used by someone else',
          data: {
            code: 'USERNAME_ALREADY_IN_USE',
          },
        })
      })

      it('Returns conflict when the "email" is already in use by another user', async () => {
        await dynamicMocks.createUser({ email: 'jane@example.com' }, { merge: true, unique: true })

        const response = await updateSelf({
          email: 'jane@example.com',
        })

        expect(response.status).toBe(409)

        const data = await response.json()

        expect(data).toEqual({
          statusCode: 409,
          message: 'This email is already being used by someone else',
          data: {
            code: 'EMAIL_ALREADY_IN_USE',
          },
        })
      })

      it('Allows keeping the same "username" and "email" (self)', async () => {
        const response = await updateSelf({
          username: requester.username,
          email: requester.email,
        })

        expect(response.status).toBe(200)
      })
    })

    describe('With invalid data', async () => {
      it('Returns bad request for invalid email', async () => {
        const response = await updateSelf({ email: 'invalid-email' })

        expect(response.status).toBe(400)
      })

      it('Returns bad request for empty username', async () => {
        const response = await updateSelf({ username: '' })

        expect(response.status).toBe(400)
      })

      it('Returns bad request for invalid JSON body', async () => {
        const response = await fetch(api(`/v1/users/${requester.username}`), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session_id=${sessionToken}`,
          },
          body: '{"username": "JohnDoe"',
        })

        expect(response.status).toBe(400)
      })

      it('Returns bad request for a short password', async () => {
        const response = await updateSelf({ password: 'Short1' })

        expect(response.status).toBe(400)
      })
    })
  })

  describe('Privileged user', () => {
    beforeEach(async () => {
      const { user, session } = await dynamicMocks.createActivatedUserWithSession({
        username: 'PrivilegedRequester',
        email: 'privileged.requester@example.com',
        extraPermissions: [Permissions.READ_USER, Permissions.UPDATE_USER_OTHERS],
        token: 'e'.repeat(96),
      })

      requester = user
      sessionToken = session.token
    })

    it('Updates another inactive user', async () => {
      const newUsername = 'JaneDoe'
      const response = await updateUser(staticMocks.user.username, { username: newUsername })

      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data.username).toBe(newUsername)
      expect(data.email).toBe(staticMocks.user.email)

      const repository = await userRepository()
      const updated = await repository.findByUsername(newUsername)

      expect(updated).not.toBeNull()
    })

    it('Updates another activated user', async () => {
      const target = await dynamicMocks.createUser(
        {
          username: 'ActivatedTarget',
          email: 'activated.target@example.com',
          permissions: [
            Permissions.CREATE_SESSION,
            Permissions.READ_SESSION,
            Permissions.UPDATE_USER,
          ],
        },
        { merge: true },
      )

      const newEmail = 'updated.target@example.com'
      const response = await updateUser(target.username, { email: newEmail })

      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data.username).toBe(target.username)
      expect(data.email).toBe(newEmail)
    })

    it('Updates itself', async () => {
      const response = await updateSelf({ username: 'PrivilegedRenamed' })

      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data.username).toBe('PrivilegedRenamed')
    })

    it('Updates another user with only the ":others" permission', async () => {
      const othersOnlyRequester = await dynamicMocks.createUser(
        {
          username: 'OthersOnlyRequester',
          email: 'others.only@example.com',
          permissions: [Permissions.READ_USER, Permissions.UPDATE_USER_OTHERS],
        },
        { merge: true },
      )
      const othersOnlySession = await dynamicMocks.createSession(
        { userId: othersOnlyRequester.id, token: 'f'.repeat(96) },
        { merge: true },
      )

      requester = othersOnlyRequester
      sessionToken = othersOnlySession.token

      const newUsername = 'JaneDoe'
      const response = await updateUser(staticMocks.user.username, { username: newUsername })

      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data.username).toBe(newUsername)
    })
  })
})
