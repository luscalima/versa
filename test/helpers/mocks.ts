import { getDatabase, rebuildDatabase } from '.'
import type { CreateUserProps } from '#server/modules/users/user'
import { faker } from '@faker-js/faker'

type DynamicActions = Partial<{
  rebuild: boolean
  merge: boolean
  unique: boolean
}>

async function createUser<T extends CreateUserProps>(
  payload?: Partial<CreateUserProps> | null,
  actions?: DynamicActions,
): Promise<T> {
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

  const table = 'users'
  const db = await getDatabase()
  const [result] = await db(table)
    .insert(data ?? staticMocks.user)
    .returning('*')

  return result
}

export const dynamicMocks = {
  createUser,
}

export const staticMocks = {
  user: {
    username: 'JohnDoe',
    email: 'john.doe@example.com',
    password: 'Password123!',
  },
}
