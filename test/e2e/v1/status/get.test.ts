import { fetch, $fetch } from 'ofetch'
import { api } from '#test/helpers'
import type { GetStatusResponse } from '#server/api/v1/status/index.get'

describe('GET /v1/status', async () => {
  describe('Anonymous user', () => {
    it('Retrieving current system status', async () => {
      const sutOne = await fetch(api('/api/v1/status'))

      expect(sutOne.status).toBe(200)

      const sutTwo = await $fetch<GetStatusResponse>(api('/api/v1/status'))
      const parsedUpdatedAt = new Date(sutTwo.updated_at).toISOString()

      expect(sutTwo.updated_at).toEqual(parsedUpdatedAt)
      expect(sutTwo.database.version).toBeTypeOf('string')
      expect(sutTwo.database.max_connections).toBeGreaterThan(0)
      expect(sutTwo.database.opened_connections).toBeGreaterThanOrEqual(0)
    })
  })
})
