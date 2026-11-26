export const Permissions = {
  READ_ACTIVATION_TOKEN: 'read:activation_token',
  READ_USER: 'read:user',
  CREATE_USER: 'create:user',
  READ_SESSION: 'read:session',
  CREATE_SESSION: 'create:session',
  UPDATE_USER: 'update:user',
  UPDATE_USER_OTHERS: 'update:user:others',
  READ_MIGRATION: 'read:migration',
  RUN_MIGRATION: 'run:migration',
  READ_STATUS: 'read:status',
  READ_STATUS_ALL: 'read:status:all',
} as const

export type Permissions = (typeof Permissions)[keyof typeof Permissions]

export const PERMISSIONS = Object.values(Permissions) as Permissions[]

export function isPermission(value: string): value is Permissions {
  return PERMISSIONS.includes(value as Permissions)
}
