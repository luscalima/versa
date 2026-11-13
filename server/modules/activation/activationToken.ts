export interface ActivationTokenProps {
  readonly id: string
  readonly userId: string
  readonly usedAt: Date | null
  readonly expiresAt: Date
  readonly createdAt?: Date
  readonly updatedAt?: Date
}

export class ActivationToken {
  private constructor(private readonly props: ActivationTokenProps) {}

  static fromPersistence(props: ActivationTokenProps): ActivationToken {
    return new ActivationToken(props)
  }

  get id(): string {
    return this.props.id
  }

  get userId(): string {
    return this.props.userId
  }

  get usedAt(): Date | null {
    return this.props.usedAt
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
}
