import { err, ok, type Result } from 'neverthrow'

export interface UserProps {
  readonly id: string
  readonly username: string
  readonly email: string
  readonly password: string
}

type CreateUserProps = Omit<UserProps, 'id'>

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: CreateUserProps): Result<User, string> {
    const usernameRegex = /^[a-zA-Z0-9]{3,}$/
    const passwordRegex = /^(?=.{8,}$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/

    if (!usernameRegex.test(props.username)) {
      return err('Username must be at least 3 only alphanumeric characters long')
    }

    if (!passwordRegex.test(props.password)) {
      return err(
        'Password must be at least 8 chars, including uppercase, lowercase, a number, and a special character.',
      )
    }

    const user = new User({
      id: crypto.randomUUID(),
      username: props.username.toLowerCase(),
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
}
