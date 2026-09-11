import type { Knex } from 'knex'
import type { Session } from '~~/server/modules/sessions/session'
import type { SessionRepository } from '~~/server/modules/sessions/sessionRepository'
import { useModelProps } from '~~/server/utils/useModelProps'

export class KnexSessionRepository implements SessionRepository {
  private readonly table = 'sessions'

  constructor(private readonly db: Knex) {}

  async save(session: Session) {
    const [saveResult] = await this.db(this.table)
      .insert(useModelProps(session, { keysToCase: 'snakeCase' }))
      .returning('*')

    return saveResult
  }
}
