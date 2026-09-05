import type { CreateUserProps, User } from './user'

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<object>
  update(username: string, payload: Partial<CreateUserProps>): Promise<object>
}
