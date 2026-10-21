import { loadEnv } from 'vite'

const env = loadEnv('', process.cwd(), '')
const baseUrl = `http://${env.MAIL_HOST}:${env.LOCAL_MAIL_WEB_PORT}/api/v1`

type Email = {
  ID: string
  From: { Name: string; Address: string }
  To: { Name: string; Address: string }[]
  Subject: string
  Text: string
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
