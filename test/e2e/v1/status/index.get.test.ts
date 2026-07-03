import { fetch, $fetch } from 'ofetch'
import { api } from '#test/helpers'
import type { GetStatusResponse } from '#server/api/v1/status/index.get'

describe('GET /v1/status', async () => {
  it('should return status 200 OK', async () => {
    const sut = await fetch(api('/api/v1/status'))

    expect(sut.status).toBe(200)
  })

  it('should return healthy database status', async () => {
    const sut = await $fetch<GetStatusResponse>(api('/api/v1/status'))
    const parsedUpdatedAt = new Date(sut.updated_at).toISOString()

    expect(sut.updated_at).toEqual(parsedUpdatedAt)
    expect(sut.database.version).toBeTypeOf('string')
    expect(sut.database.max_connections).toBeGreaterThan(0)
    expect(sut.database.opened_connections).toBeGreaterThanOrEqual(0)
  })
})
