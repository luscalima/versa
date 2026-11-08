import { loadEnv } from 'vite'
import { getDatabase } from './database'

const env = loadEnv('', process.cwd(), '')
const baseUrl = `http://${env.MAIL_HOST}:${env.LOCAL_MAIL_WEB_PORT}/api/v1`

type Email = {
  ID: string
  From: { Name: string; Address: string }
  To: { Name: string; Address: string }[]
  Subject: string
  Text: string
}

type ActivationToken = {
  id: string
  user_id: string
  used_at: Date | null
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export async function clearMailInbox() {
  const url = `${baseUrl}/messages`

  await fetch(url, { method: 'DELETE' })
}

export async function getAllEmails() {
  const url = `${baseUrl}/messages`
  const response = await fetch(url)
  const data = (await response.json()) as { messages: Email[] }

  return data
}

export async function getLastEmail() {
  const emails = await getAllEmails()
  const lastMail = emails.messages.pop()
  const lastMailId = lastMail?.ID

  if (!lastMailId) {
    return null
  }

  const url = `${baseUrl}/message/${lastMailId}`
  const response = await fetch(url)
  const email = (await response.json()) as Email

  return email
}

export function mailHealthyStatus() {
  return `${baseUrl}/info`
}

export async function getActivationTokenByUserId(
  userId: string,
): Promise<ActivationToken | undefined> {
  const table = 'user_activation_tokens'
  const db = await getDatabase()

  return db(table).where({ user_id: userId }).first()
}
