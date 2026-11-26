import { getDatabase, rebuildDatabase } from '.'
import type { CreateUserProps, UserProps } from '#server/modules/users/user'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'
import type { SessionProps } from '#server/modules/sessions/session'
import { SessionService } from '#server/modules/sessions/sessionService'
import type { ActivationTokenProps } from '#server/modules/activation/activationToken'
import { ActivationService } from '#server/modules/activation/activationService'
import { Permissions } from '#server/modules/authorization/permissions'

type DynamicActions = Partial<{
  rebuild: boolean
  merge: boolean
  unique: boolean
}>

type UserSeed = Partial<CreateUserProps> & Partial<{ permissions: Permissions[] }>

export type SeededUser = UserProps & { permissions: Permissions[] }

type ActivatedUserSeed = Omit<UserSeed, 'permissions'> & {
  token?: string
  extraPermissions?: Permissions[]
}

const ACTIVATED_PERMISSIONS: Permissions[] = [
  Permissions.CREATE_SESSION,
  Permissions.READ_SESSION,
  Permissions.UPDATE_USER,
  Permissions.READ_STATUS,
]

async function createUser(
  payload?: UserSeed | null,
  actions?: DynamicActions,
): Promise<SeededUser> {
  let data = payload ? { ...payload } : staticMocks.user

  if (actions?.unique) {
    if (!data.username) data.username = faker.internet.username().replace(/[_.-]g/, '')
    if (!data.email) data.email = faker.internet.email()
  }

  if (actions?.merge) {
    data = { ...staticMocks.user, ...data }
  }

  if (actions?.rebuild) {
    await rebuildDatabase()
  }

  const dataToSave = { ...data }

  dataToSave.password = bcrypt.hashSync(dataToSave.password!, 1)

  const table = 'users'
  const db = await getDatabase()
  const [result] = await db(table).insert(dataToSave).returning('*')

  return result
}

async function createSession(
  payload: Partial<SessionProps>,
  actions?: DynamicActions,
): Promise<SessionProps> {
  let data = payload ? { ...payload } : staticMocks.session

  if (actions?.merge) {
    data = { ...staticMocks.session, ...data }
  }

  if (actions?.rebuild) {
    await rebuildDatabase()
  }

  const dataToSave = { ...data }

  const table = 'sessions'
  const db = await getDatabase()
  const [result] = await db(table).insert(dataToSave).returning('*')

  return result
}

async function createActivationToken(
  payload: Partial<ActivationTokenProps>,
  actions?: DynamicActions,
): Promise<ActivationTokenProps> {
  const data = { ...staticMocks.activationToken, ...payload }

  if (actions?.rebuild) {
    await rebuildDatabase()
  }

  const db = await getDatabase()
  const [result] = await db('user_activation_tokens').insert(data).returning('*')

  return result
}

async function getSession(token = staticMocks.session.token): Promise<SessionProps> {
  const table = 'sessions'
  const db = await getDatabase()

  return db(table).where({ token }).first()
}

async function createActivatedUserWithSession(
  payload?: ActivatedUserSeed,
): Promise<{ user: SeededUser; session: SessionProps }> {
  const { token, extraPermissions, ...userSeed } = payload ?? {}
  const user = await createUser(
    { ...userSeed, permissions: [...ACTIVATED_PERMISSIONS, ...(extraPermissions ?? [])] },
    { merge: true },
  )
  const session = await createSession(
    { userId: user.id, ...(token ? { token } : {}) },
    { merge: true },
  )

  return { user, session }
}

export const dynamicMocks = {
  createUser,
  createSession,
  createActivationToken,
  createActivatedUserWithSession,
  getSession,
}

export const staticMocks = {
  user: {
    username: 'JohnDoe',
    email: 'john.doe@example.com',
    password: 'Password123!',
    permissions: [] as Permissions[],
  },
  session: {
    token:
      '6e36cd7dd67594901b9d306e87d1def5f741a2fd2440343b1833454684f2180d37914183133b282c56ca275989e1b9bb',
    // using a getter so that the result is affected by fake timers
    get expiresAt() {
      return new Date(Date.now() + SessionService.EXPIRATION_IN_MILLISECONDS)
    },
  },
  activationToken: {
    // using a getter so that the result is affected by fake timers
    get expiresAt() {
      return new Date(Date.now() + ActivationService.EXPIRATION_IN_MILLISECONDS)
    },
  },
}
