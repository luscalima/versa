import { fetch, setup } from '@nuxt/test-utils/e2e'
import { clearDatabase, destroyDatabase } from '../../../helpers/database'

await setup({})

describe('POST /v1/migrations', async () => {
  beforeAll(async () => {
    await clearDatabase()
  })

  afterAll(async () => {
    await destroyDatabase()
  })

  it('should run all pending migrations and return an empty completed list', async () => {
    const sutOne = await fetch('/api/v1/migrations', { method: 'POST' })
    const bodyOne = await sutOne.json()

    expect(sutOne.status).toBe(201)
    expect(Array.isArray(bodyOne.completed)).toBe(true)
    expect(bodyOne.completed.length).toBeGreaterThan(0)

    const sutTwo = await fetch('/api/v1/migrations', { method: 'POST' })
    const bodyTwo = await sutTwo.json()

    expect(sutTwo.status).toBe(200)
    expect(Array.isArray(bodyTwo.completed)).toBe(true)
    expect(bodyTwo.completed.length).toBe(0)
  })
})
