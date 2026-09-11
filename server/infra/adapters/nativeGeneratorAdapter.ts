import crypto from 'node:crypto'
import type { GeneratorPort } from '~~/server/modules/generator/generatorPort'

export class NativeGeneratorAdapter implements GeneratorPort {
  randomUUID(): string {
    return crypto.randomUUID()
  }

  randomToken(size: number = 48): string {
    return crypto.randomBytes(size).toString('hex')
  }

  futureDate(millisecondsToFuture: number): Date {
    return new Date(Date.now() + millisecondsToFuture)
  }
}
