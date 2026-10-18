import type { Session } from './session'

export interface SessionRepository {
  save(session: Session): Promise<Session>
  update(id: string, session: Partial<Session>): Promise<Session>
  findValid(token: string): Promise<Session | null>
}
