export type MailSendOptions = {
  from: string
  to: string
  subject: string
  text: string
  html?: string
}

export interface MailPort {
  send(options: MailSendOptions): Promise<void>
}
