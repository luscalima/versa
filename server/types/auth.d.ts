import type { UserContext } from '~~/server/modules/users/user'

declare module 'h3' {
  interface H3EventContext {
    user: UserContext
  }
}
