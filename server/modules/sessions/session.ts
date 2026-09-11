export interface SessionProps {
  readonly id: string
  readonly token: string
  readonly userId: string
  readonly expiresAt: Date
}

export type CreateSessionProps = SessionProps

export class Session {
  private constructor(private readonly props: SessionProps) {}

  static create(props: CreateSessionProps): Session {
    return new Session(props)
  }

  static fromPersistence(props: SessionProps): Session {
    return new Session(props)
  }

  get id(): string {
    return this.props.id
  }

  get token(): string {
    return this.props.token
  }

  get userId(): string {
    return this.props.userId
  }

  get expiresAt(): Date {
    return this.props.expiresAt
  }
}
