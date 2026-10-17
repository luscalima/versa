import { fetch, $fetch } from 'ofetch'
import { api } from '#test/helpers'
import type { GetStatusResponse } from '#server/api/v1/status/index.get'

describe('GET /v1/status', async () => {
  describe('Anonymous user', () => {
    it('Retrieving current system status', async () => {
      const sutOne = await fetch(api('/v1/status'))

      expect(sutOne.status).toBe(200)

      const sutTwo = await $fetch<GetStatusResponse>(api('/v1/status'))
      const parsedUpdatedAt = new Date(sutTwo.updatedAt).toISOString()

      expect(sutTwo.updatedAt).toEqual(parsedUpdatedAt)
      expect(sutTwo.database.version).toBeTypeOf('string')
      expect(sutTwo.database.maxConnections).toBeGreaterThan(0)
      expect(sutTwo.database.openedConnections).toBeGreaterThanOrEqual(0)
    })
  })
})
