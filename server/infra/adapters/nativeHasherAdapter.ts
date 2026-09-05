import bcrypt from 'bcrypt'
import type { HasherPort } from '~~/server/modules/hasher/hasherPort'

export class NativeHasherAdapter implements HasherPort {
  async password(payload: string): Promise<string> {
    return await bcrypt.hash(payload, this.costByEnv)
  }

  async compare(payload: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(payload, hashed)
  }

  private get costByEnv() {
    return import.meta.env.NODE_ENV === 'production' ? 14 : 1
  }
}
