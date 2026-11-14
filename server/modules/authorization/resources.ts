export const Resource = {
  READ_ACTIVATION_TOKEN: 'read:activation_token',
  READ_USERS: 'read:users',
  CREATE_USERS: 'create:users',
  READ_SESSIONS: 'read:sessions',
  CREATE_SESSIONS: 'create:sessions',
  UPDATE_USERS: 'update:users',
} as const

export type Resource = (typeof Resource)[keyof typeof Resource]

export const RESOURCES = Object.values(Resource) as Resource[]

export function isResource(value: string): value is Resource {
  return RESOURCES.includes(value as Resource)
}
