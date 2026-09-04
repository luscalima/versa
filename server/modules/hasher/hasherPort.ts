export interface HasherPort {
  password(payload: string, salt?: string, pepper?: string): Promise<string>
  compare(payload: string, hashed: string): Promise<boolean>
}
