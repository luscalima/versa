import type { Session } from './session'

export interface SessionRepository {
  save(session: Session): Promise<Session>
  findOneByToken(token: string): Promise<Session | null>
}
