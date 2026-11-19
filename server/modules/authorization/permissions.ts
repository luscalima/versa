export const Permissions = {
  READ_ACTIVATION_TOKEN: 'read:activation_token',
  READ_USERS: 'read:users',
  CREATE_USERS: 'create:users',
  READ_SESSIONS: 'read:sessions',
  CREATE_SESSIONS: 'create:sessions',
  UPDATE_USERS: 'update:users',
} as const

export type Permissions = (typeof Permissions)[keyof typeof Permissions]

export const PERMISSIONS = Object.values(Permissions) as Permissions[]

export function isPermission(value: string): value is Permissions {
  return PERMISSIONS.includes(value as Permissions)
}
