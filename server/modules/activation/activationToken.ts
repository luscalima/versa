export interface ActivationTokenProps {
  readonly id: string
  readonly userId: string
  readonly usedAt: Date | null
  readonly expiresAt: Date
  readonly createdAt?: Date
  readonly updatedAt?: Date
}

export type ActivationTokenDTO = ActivationTokenProps
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

  toDTO(): ActivationTokenDTO {
    return {
      id: this.id,
      userId: this.userId,
      usedAt: this.usedAt,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
