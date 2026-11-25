import { Permissions } from './permissions'
import type { ActivationToken } from '../activation/activationToken'
import type { Session } from '../sessions/session'
import type { User, UserContext } from '../users/user'

type ResourceMap = {
  user: User
  session: Session
  activation_token: ActivationToken
}

type PermissionResource<P extends Permissions> = P extends `${string}:${infer R}:${string}`
  ? R
  : P extends `${string}:${infer R}`
    ? R
    : never

type IsUnion<T, U = T> = T extends unknown ? ([U] extends [T] ? false : true) : never

export type SharedResource<Ps extends readonly Permissions[]> =
  IsUnion<PermissionResource<Ps[number]>> extends true
    ? { readonly error: 'All permissions must target the same resource' }
    : ResourceMap[PermissionResource<Ps[number]>]

export type PermissionContext<P extends Permissions> = {
  subject: UserContext
  resource: ResourceMap[PermissionResource<P>]
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
  [Permissions.UPDATE_USER_OTHERS]: () => {
    return true
  },
}
