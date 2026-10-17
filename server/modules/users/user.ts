import { err, ok, type Result } from 'neverthrow'

export interface UserProps {
  readonly id: string
  readonly username: string
  readonly email: string
  readonly password: string
  readonly createdAt?: Date
  readonly updatedAt?: Date
}

export type CreateUserProps = Pick<UserProps, 'username' | 'email' | 'password'>

export type UserDTO = Omit<UserProps, 'password'>

export type UserError = {
  code: 'INVALID_USERNAME'
  message: string
}

export class User {
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
      email: props.email.toLowerCase(),
    })

    return ok(user)
  }

  static fromPersistence(props: UserProps): User {
    const user = new User(props)

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
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
