import * as m0 from './migrations/20260807151954_create_users'
import * as m1 from './migrations/20260911022644_create_sessions'
import * as m2 from './migrations/20261021233221_alter_user_add_resources'
import * as m3 from './migrations/20261107174643_create_user_activation_tokens'

export const migrations = [
  {
    name: '20260807151954_create_users.ts',
    module: m0,
  },
  {
    name: '20260911022644_create_sessions.ts',
    module: m1,
  },
  {
    name: '20261021233221_alter_user_add_resources.ts',
    module: m2,
  },
  {
    name: '20261107174643_create_user_activation_tokens.ts',
    module: m3,
  }
]