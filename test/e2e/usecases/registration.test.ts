import { fetch } from 'ofetch'
import setCookieParser from 'set-cookie-parser'
import { version as uuidVersion } from 'uuid'
import { SessionService } from '#server/modules/sessions/sessionService'
import { Permissions } from '#server/modules/authorization/permissions'
import {
  api,
  appUrl,
  clearMailInbox,
  destroyDatabase,
  expireActivationTokenById,
  getLastEmail,
  getValidActivationTokenById,
  rebuildDatabase,
  userRepository,
} from '#test/helpers'

const USER_PAYLOAD = {
  username: 'JohnDoe',
  email: 'john.doe@example.com',
  password: 'Password123!',
}

const ACTIVATION_ENDPOINT = '/v1/activations'
const ACTIVATION_EMAIL_SUBJECT = 'Activate your account'
const ACTIVATION_TOKEN_PATTERN = /\/([a-fA-F0-9-]*)$/im
const ACTIVATION_TOKEN_SENDER_EMAIL = 'contact@versa.com'

describe('Account registration and activation flow', () => {
  beforeEach(async () => {
    await rebuildDatabase()
    await clearMailInbox()
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  async function requestUserCreation(payload = USER_PAYLOAD) {
    return fetch(api('/v1/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  async function requestAccountActivation(tokenId?: string) {
    const url = `${ACTIVATION_ENDPOINT}/${tokenId}`

    return fetch(api(url), { method: 'PATCH' })
  }

  async function requestSessionCreation(payload = USER_PAYLOAD) {
    return fetch(api('/v1/sessions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    })
  }

  async function getLastActivationEmail() {
    const email = await getLastEmail()

    expect(email).not.toBeNull()

    return email!
  }

  function extractActivationToken(text: string) {
    const match = text.match(ACTIVATION_TOKEN_PATTERN)

    expect(match).not.toBeNull()

    return match![1]
  }

  async function registerUser(payload = USER_PAYLOAD) {
    const response = await requestUserCreation(payload)

    expect(response.status).toBe(201)

    return response
  }

  async function registerUserAndGetActivationToken(payload = USER_PAYLOAD) {
    await registerUser(payload)

    const email = await getLastActivationEmail()

    return extractActivationToken(email.Text)
  }

  async function activateRegisteredUser(payload = USER_PAYLOAD) {
    const token = await registerUserAndGetActivationToken(payload)
    const response = await requestAccountActivation(token)

    expect(response.status).toBe(200)

    return token
  }

  describe('User registration', () => {
    it('creates a user with unique and valid data', async () => {
      const response = await requestUserCreation()

      expect(response.status).toBe(201)

      const data = await response.json()

      expect(data).toEqual({
        id: data.id,
        username: USER_PAYLOAD.username,
        email: USER_PAYLOAD.email,
        permissions: [Permissions.READ_ACTIVATION_TOKEN],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      expect(uuidVersion(data.id)).toBe(4)
      expect(data).not.toHaveProperty('password')
      expect(Date.parse(data.createdAt)).not.toBeNaN()
      expect(Date.parse(data.updatedAt)).not.toBeNaN()
    })

    it('starts the account as inactive', async () => {
      await registerUser()

      const response = await requestSessionCreation()

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({
        statusCode: 403,
        message: 'The requested operation could not be completed.',
        data: {
          code: 'ACCESS_DENIED',
        },
      })
    })
  })

  describe('Activation email delivery', () => {
    it('sends an activation email to the registered address', async () => {
      const appUrlValue = appUrl()
      const response = await registerUser()
      const user = await response.json()

      const email = await getLastActivationEmail()
      const tokenId = extractActivationToken(email.Text)

      const activationToken = await getValidActivationTokenById(tokenId)

      expect(activationToken).not.toBeNull()
      expect(activationToken!.id).toBe(tokenId)
      expect(activationToken!.userId).toBe(user.id)
      expect(activationToken!.usedAt).toBeNull()

      expect(email.To.map(recipient => recipient.Address)).toContain(USER_PAYLOAD.email)
      expect(email.Subject).toBe(ACTIVATION_EMAIL_SUBJECT)
      expect(email.Text).toContain(USER_PAYLOAD.username)
      expect(email.Text).toContain(`${appUrlValue}/register/activate/${tokenId}`)
      expect(email.From.Address).toBe(ACTIVATION_TOKEN_SENDER_EMAIL)
    })

    it('sends a different activation token for each registered user', async () => {
      await registerUser()
      const firstToken = extractActivationToken((await getLastActivationEmail()).Text)

      await clearMailInbox()

      await registerUser({
        username: 'JaneDoe',
        email: 'jane.doe@example.com',
        password: 'Password456!',
      })

      const secondToken = extractActivationToken((await getLastActivationEmail()).Text)

      expect(secondToken).not.toBe(firstToken)
    })
  })

  describe('Account activation', () => {
    it('activates the account with a valid token', async () => {
      const token = await registerUserAndGetActivationToken()
      const response = await requestAccountActivation(token)

      expect(response.status).toBe(200)

      const responseData = await response.json()

      expect(Date.parse(responseData.usedAt)).not.toBeNaN()

      const repository = await userRepository()
      const activatedUser = await repository.findByUsername(USER_PAYLOAD.username)
      expect(activatedUser?.permissions).toEqual([
        Permissions.CREATE_SESSIONS,
        Permissions.READ_SESSIONS,
        Permissions.UPDATE_USERS,
      ])
    })

    it('does not allow the same activation token to be used twice', async () => {
      const token = await registerUserAndGetActivationToken()

      expect((await requestAccountActivation(token)).status).toBe(200)

      const response = await requestAccountActivation(token)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({
        statusCode: 403,
        message: 'You do not have permission to perform this action',
        data: {
          code: 'ACCESS_DENIED',
          missing: [Permissions.READ_ACTIVATION_TOKEN],
        },
      })
    })

    it('rejects an unknown activation token', async () => {
      await registerUser()

      const response = await requestAccountActivation('a'.repeat(96))

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        statusCode: 400,
        message: 'The provided token is invalid or expired.',
        data: {
          code: 'TOKEN_UNAVAILABLE',
        },
      })
    })

    it('rejects activation without a token', async () => {
      await registerUser()

      const response = await requestAccountActivation()

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        statusCode: 400,
        message: 'Activation token is invalid',
        data: {
          code: 'INVALID_ACTIVATION_TOKEN',
        },
      })
    })

    it('rejects an expired activation token', async () => {
      const token = await registerUserAndGetActivationToken()

      await expireActivationTokenById(token)

      const response = await requestAccountActivation(token)

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        statusCode: 400,
        message: 'The provided token is invalid or expired.',
        data: {
          code: 'TOKEN_UNAVAILABLE',
        },
      })
    })
  })

  describe('Login', () => {
    it('creates a session after the account is activated', async () => {
      await activateRegisteredUser()

      const response = await requestSessionCreation()

      expect(response.status).toBe(201)

      const data = await response.json()

      expect(data).toEqual({
        id: data.id,
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
      expect(uuidVersion(data.id)).toBe(4)
      expect(Date.parse(data.expiresAt)).not.toBeNaN()
      expect(Date.parse(data.createdAt)).not.toBeNaN()
      expect(Date.parse(data.updatedAt)).not.toBeNaN()

      const setCookie = setCookieParser(response, { map: true })

      expect(setCookie.session_id).toEqual({
        name: 'session_id',
        value: data.token,
        maxAge: SessionService.EXPIRATION_IN_MILLISECONDS / 1000,
        path: '/',
        httpOnly: true,
      })
    })
  })

  describe('User information retrieval', () => {
    async function loginAndGetSessionCookie() {
      await activateRegisteredUser()

      const response = await requestSessionCreation()

      expect(response.status).toBe(201)

      const setCookie = setCookieParser(response, { map: true })

      expect(setCookie.session_id).toBeDefined()

      return setCookie.session_id!
    }

    it('retrieves the authenticated user information', async () => {
      const sessionCookie = await loginAndGetSessionCookie()

      const response = await fetch(api('/v1/user'), {
        headers: {
          Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
        },
      })

      expect(response.status).toBe(200)

      const data = await response.json()

      expect(data).toMatchObject({
        username: USER_PAYLOAD.username,
        email: USER_PAYLOAD.email,
        permissions: [
          Permissions.CREATE_SESSIONS,
          Permissions.READ_SESSIONS,
          Permissions.UPDATE_USERS,
        ],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
      expect(uuidVersion(data.id)).toBe(4)
      expect(data).not.toHaveProperty('password')
    })

    it('retrieves a user by username', async () => {
      await activateRegisteredUser()

      const response = await fetch(api(`/v1/users/${USER_PAYLOAD.username}`))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        username: USER_PAYLOAD.username,
        email: USER_PAYLOAD.email,
      })
    })

    it('retrieves a user by username case-insensitively', async () => {
      await activateRegisteredUser()

      const response = await fetch(api(`/v1/users/${USER_PAYLOAD.username.toLowerCase()}`))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        username: USER_PAYLOAD.username,
        email: USER_PAYLOAD.email,
      })
    })
  })
})
