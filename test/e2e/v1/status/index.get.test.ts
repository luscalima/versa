import { setup, fetch, $fetch } from '@nuxt/test-utils/e2e'
// TODO: how to improve DX with absolut path alias
import type { GetStatusResponse } from '../../../../server/api/v1/status/index.get'

await setup({})

describe('GET /v1/status', async () => {
  it('should return status 200 OK', async () => {
    const sut = await fetch('/api/v1/status')

    expect(sut.status).toBe(200)
  })

  it('should return healthy database status', async () => {
    const sut = await $fetch<GetStatusResponse>('/api/v1/status')
    const parsedUpdatedAt = new Date(sut.updated_at).toISOString()

    expect(sut.updated_at).toEqual(parsedUpdatedAt)
    expect(sut.database.version).toBeTypeOf('string')
    expect(sut.database.max_connections).toBeGreaterThan(0)
    expect(sut.database.opened_connections).toBeGreaterThanOrEqual(1)
  })
})
