export const Resource = {
  READ_ACTIVATION_TOKEN: 'read:activation_token',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  SESSIONS_READ: 'sessions:read',
  SESSIONS_WRITE: 'sessions:write',
} as const

export type Resource = (typeof Resource)[keyof typeof Resource]

export const RESOURCES = Object.values(Resource) as Resource[]

export function isResource(value: string): value is Resource {
  return RESOURCES.includes(value as Resource)
}
