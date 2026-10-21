import type { MailPort, MailSendOptions } from '~~/server/modules/mail/mailPort'
import { createTransport, type Transporter } from 'nodemailer'

export type NodemailerMailAdapterConfig = {
  host: string
  port: number
  user: string
  password: string
}

export class NodemailerMailAdapter implements MailPort {
  #transporter: Transporter

  constructor(config: NodemailerMailAdapterConfig) {
    this.#transporter = createTransport({
      host: config.host,
      port: config.port,
      auth: {
        user: config.user,
        pass: config.password,
      },
      secure: process.env.NODE_ENV === 'production',
    })
  }

  async send(options: MailSendOptions): Promise<void> {
    await this.#transporter.sendMail(options)
  }
}
