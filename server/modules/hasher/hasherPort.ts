export interface HasherPort {
  readonly dummyHash: string
  password(payload: string, salt?: string, pepper?: string): Promise<string>
  compare(payload: string, hashed: string): Promise<boolean>
}
