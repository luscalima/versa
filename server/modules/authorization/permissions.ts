export const Permission = {
  READ_ACTIVATION_TOKEN: 'read:activation_token',
  READ_USERS: 'read:users',
  CREATE_USERS: 'create:users',
  READ_SESSIONS: 'read:sessions',
  CREATE_SESSIONS: 'create:sessions',
  UPDATE_USERS: 'update:users',
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

export const PERMISSIONS = Object.values(Permission) as Permission[]

export function isPermission(value: string): value is Permission {
  return PERMISSIONS.includes(value as Permission)
}
