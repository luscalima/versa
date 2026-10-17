import bcrypt from 'bcrypt'
import type { HasherPort } from '~~/server/modules/hasher/hasherPort'

const COST_BY_ENV = import.meta.env.NODE_ENV === 'production' ? 14 : 1

let dummyHash: string | undefined

export class NativeHasherAdapter implements HasherPort {
  get dummyHash(): string {
    dummyHash ??= bcrypt.hashSync(crypto.randomUUID(), COST_BY_ENV)
    return dummyHash
  }

  async hash(payload: string): Promise<string> {
    return await bcrypt.hash(payload, COST_BY_ENV)
  }

  async compare(payload: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(payload, hashed)
  }
}
