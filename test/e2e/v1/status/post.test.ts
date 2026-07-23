import { fetch } from 'ofetch'
import { api } from '#test/helpers'

describe('POST /v1/status', async () => {
  describe('Anonymous user', () => {
    it('Retrieving current system status', async () => {
      const sut = await fetch(api('/api/v1/status'), {
        method: 'POST',
      })
      const body = await sut.json()

      expect(sut.status).toBe(405)
      expect(body).toEqual({
        status_code: 405,
        message: 'The HTTP method used is not allowed for this endpoint.',
        data: {
          code: 'METHOD_NOT_ALLOWED',
        },
      })
    })
  })
})
