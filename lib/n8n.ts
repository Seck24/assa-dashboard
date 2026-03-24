/**
 * Appel n8n côté serveur uniquement (jamais exposé au client)
 */

const N8N_BASE = process.env.N8N_WEBHOOK_URL || 'https://automation.preo-ia.info/webhook'

export async function n8nPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${N8N_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}
