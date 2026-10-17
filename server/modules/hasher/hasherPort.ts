export interface HasherPort {
  readonly dummyHash: string
  hash(payload: string, salt?: string, pepper?: string): Promise<string>
  compare(payload: string, hashed: string): Promise<boolean>
}
