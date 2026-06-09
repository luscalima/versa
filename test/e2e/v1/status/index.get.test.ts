import { setup, fetch } from '@nuxt/test-utils/e2e'

await setup()

describe('GET /v1/status', async () => {
  it('should return status 200 OK', async () => {
    const sut = await fetch('/v1/status')

    expect(sut.status).toBe(200)
  })
})
