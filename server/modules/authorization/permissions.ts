export const Permissions = {
  READ_ACTIVATION_TOKEN: 'read:activation_token',
  READ_USER: 'read:users',
  CREATE_USER: 'create:users',
  READ_SESSION: 'read:sessions',
  CREATE_SESSION: 'create:sessions',
  UPDATE_USER: 'update:users',
} as const

export type Permissions = (typeof Permissions)[keyof typeof Permissions]

export const PERMISSIONS = Object.values(Permissions) as Permissions[]

export function isPermission(value: string): value is Permissions {
  return PERMISSIONS.includes(value as Permissions)
}
