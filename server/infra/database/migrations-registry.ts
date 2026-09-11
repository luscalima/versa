import * as m0 from './migrations/20260807151954_create_users'
import * as m1 from './migrations/20260911022644_create_sessions'

export const migrations = [
  {
    name: '20260807151954_create_users.ts',
    module: m0,
  },
  {
    name: '20260911022644_create_sessions.ts',
    module: m1,
  }
]