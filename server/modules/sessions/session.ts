export interface SessionProps {
  readonly id: string
  readonly token: string
  readonly userId: string
  readonly expiresAt: Date
  readonly createdAt?: Date
  readonly updatedAt?: Date
}

export type SessionDTO = SessionProps

export class Session {
  private constructor(private readonly props: SessionProps) {}

  static create(props: SessionProps): Session {
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

  get createdAt(): Date | undefined {
    return this.props.createdAt
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt
  }

  toDTO(): SessionDTO {
    return {
      id: this.id,
      token: this.token,
      userId: this.userId,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
