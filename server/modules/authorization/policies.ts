import { Permissions } from './permissions'
import type { ActivationToken } from '../activation/activationToken'
import type { Session } from '../sessions/session'
import type { User, UserContext } from '../users/user'

type ResourceMap = {
  user: User
  session: Session
  activation_token: ActivationToken
}

export type PermissionContext<P extends Permissions> = {
  subject: UserContext
  resource: ResourceMap[P extends `${string}:${infer R}` ? R : never]
}

type PoliciesMap = Partial<{
  [P in Permissions]: (context: PermissionContext<P>) => boolean
}>

export const Policies: PoliciesMap = {
  [Permissions.CREATE_USER]: context => {
    return context.subject.isAnonymous
  },
  [Permissions.UPDATE_USER]: ({ subject, resource }) => {
    return subject.id === resource.id
  },
}
