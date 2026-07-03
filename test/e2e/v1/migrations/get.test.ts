import { fetch } from 'ofetch'
import { clearDatabase, destroyDatabase, api } from '#test/helpers'

describe('GET /v1/migrations', async () => {
  beforeAll(async () => {
    await clearDatabase()
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  it('should return pending migrations on a clean database', async () => {
    const sut = await fetch(api('/api/v1/migrations'))
    const body = await sut.json()

    expect(sut.status).toBe(200)
    expect(Array.isArray(body.completed)).toBe(true)
    expect(Array.isArray(body.pending)).toBe(true)
    expect(body.completed.length).toBe(0)
    expect(body.pending.length).toBeGreaterThan(0)
  })
})
