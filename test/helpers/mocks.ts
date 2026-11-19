import { getDatabase, rebuildDatabase } from '.'
import type { CreateUserProps, UserProps } from '#server/modules/users/user'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'
import type { SessionProps } from '#server/modules/sessions/session'
import { SessionService } from '#server/modules/sessions/sessionService'
import type { Permission } from '#server/modules/authorization/permissions'

type DynamicActions = Partial<{
  rebuild: boolean
  merge: boolean
  unique: boolean
}>

type UserSeed = Partial<CreateUserProps> & Partial<{ permissions: Permission[] }>

type SeededUser = UserProps & { permissions: Permission[] }

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

async function getSession(token = staticMocks.session.token): Promise<SessionProps> {
  const table = 'sessions'
  const db = await getDatabase()

  return db(table).where({ token }).first()
}

export const dynamicMocks = {
  createUser,
  createSession,
  getSession,
}

export const staticMocks = {
  user: {
    username: 'JohnDoe',
    email: 'john.doe@example.com',
    password: 'Password123!',
    permissions: [] as Permission[],
  },
  session: {
    token:
      '6e36cd7dd67594901b9d306e87d1def5f741a2fd2440343b1833454684f2180d37914183133b282c56ca275989e1b9bb',
    // using a getter so that the result is affected by fake timers
    get expiresAt() {
      return new Date(Date.now() + SessionService.EXPIRATION_IN_MILLISECONDS)
    },
  },
}
