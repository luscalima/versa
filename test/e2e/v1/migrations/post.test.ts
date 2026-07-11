import { fetch } from 'ofetch'
import { clearDatabase, destroyDatabase, api } from '#test/helpers'

describe('POST /v1/migrations', async () => {
  beforeAll(async () => {
    await clearDatabase()
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  describe('Anonymous user', () => {
    describe('Running pending migrations', async () => {
      it('For the first time', async () => {
        const sut = await fetch(api('/api/v1/migrations'), { method: 'POST' })
        const body = await sut.json()

        expect(sut.status).toBe(201)
        expect(Array.isArray(body.completed)).toBe(true)
        expect(body.completed.length).toBeGreaterThan(0)
      })

      it('For the other times', async () => {
        const sut = await fetch(api('/api/v1/migrations'), { method: 'POST' })
        const body = await sut.json()

        expect(sut.status).toBe(200)
        expect(Array.isArray(body.completed)).toBe(true)
        expect(body.completed.length).toBe(0)
      })
    })
  })
})
