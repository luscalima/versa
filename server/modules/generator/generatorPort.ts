export interface GeneratorPort {
  randomToken(size?: number): string
  randomUUID(): string
  futureDate(millisecondsToFuture: number): Date
}
