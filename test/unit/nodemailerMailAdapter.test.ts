import { loadEnv } from 'vite'
import { NodemailerMailAdapter } from '#server/infra/adapters/nodemailerMailAdapter'
import { clearMailInbox, getLastEmail } from '#test/helpers'

const env = loadEnv('', process.cwd(), '')

describe('NodemailerMailAdapter', () => {
  const nodemailerMailAdapter = new NodemailerMailAdapter({
    host: env.MAIL_HOST,
    port: Number(env.MAIL_PORT),
    user: env.MAIL_USER,
    password: env.MAIL_PASSWORD,
  })

  beforeEach(async () => {
    await clearMailInbox()
  })

  describe('send()', () => {
    it('With success', async () => {
      await nodemailerMailAdapter.send({
        from: 'John <john.doe@email.com>',
        to: 'jane@email.com',
        subject: 'Test of email',
        text: 'Hello World!',
      })

      const email = await getLastEmail()

      expect(email?.From.Name).toBe('John')
      expect(email?.From.Address).toBe('john.doe@email.com')
      expect(email?.To[0].Address).toBe('jane@email.com')
      expect(email?.Subject).toBe('Test of email')
      expect(email?.Text).toBe('Hello World!\r\n')
    })
  })
})
