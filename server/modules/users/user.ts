import { err, ok, type Result } from 'neverthrow'
import { isResource } from '../authorization/resources'
import type { Resource } from '../authorization/resources'

export interface UserProps {
  readonly id: string
  readonly username: string
  readonly email: string
  readonly password: string
  readonly resources: Resource[]
  readonly createdAt?: Date
  readonly updatedAt?: Date
}

export type CreateUserProps = Pick<UserProps, 'username' | 'email' | 'password' | 'resources'>

export type UserDTO = Omit<UserProps, 'password'>

export type UserError = {
  code: 'INVALID_USERNAME'
  message: string
}

export interface UserContext extends Omit<UserProps, 'password' | 'createdAt' | 'updatedAt'> {
  readonly isAnonymous: boolean
}

export const ANONYMOUS_USER_ID = 'anonymous'

export class User implements UserContext {
  readonly isAnonymous = false

  private constructor(private readonly props: UserProps) {}

  static create(props: CreateUserProps): Result<User, UserError> {
    const usernameRegex = /^[a-zA-Z0-9]{3,}$/

    if (!usernameRegex.test(props.username)) {
      return err({
        code: 'INVALID_USERNAME',
        message: 'Username must be at least 3 only alphanumeric characters long',
      })
    }

    const user = new User({
      id: crypto.randomUUID(),
      username: props.username,
      password: props.password,
      resources: props.resources,
      email: props.email.toLowerCase(),
    })

    return ok(user)
  }

  static fromPersistence(props: UserProps): User {
    const user = new User({
      ...props,
      resources: props.resources.filter(isResource),
    })

    return user
  }

  get id(): string {
    return this.props.id
  }

  get username(): string {
    return this.props.username
  }

  get email(): string {
    return this.props.email
  }

  get password(): string {
    return this.props.password
  }

  get resources(): Resource[] {
    return this.props.resources
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt
  }

  toDTO(): UserDTO {
    return {
      id: this.id,
      username: this.username,
      resources: this.resources,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

export class AnonymousUser implements UserContext {
  readonly id = ANONYMOUS_USER_ID
  readonly username = ANONYMOUS_USER_ID
  readonly email = ''
  readonly resources: Resource[] = []
  readonly isAnonymous = true
}
