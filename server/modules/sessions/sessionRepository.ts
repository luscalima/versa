import type { Session } from './session'

export interface SessionRepository {
  save(session: Session): Promise<object>
}
