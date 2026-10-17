import { fetch } from 'ofetch'
import { api } from '#test/helpers'

describe('Unknown API route', async () => {
  describe('Anonymous user', () => {
    it('Returns a structured "not found" response', async () => {
      const response = await fetch(api('/v1/does-not-exist'))
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body).toEqual({
        statusCode: 404,
        message: 'The requested resource could not be found.',
        data: {
          code: 'NOT_FOUND',
        },
      })
    })
  })
})
