import { NextRequest } from 'next/server'

/**
 * Vérifie que la requête vient bien de notre domaine (protection CSRF)
 * Bloque les requêtes cross-origin sans Origin/Referer valide
 */
const ALLOWED_ORIGINS = [
  'https://assa-dashboard.preo-ia.info',
  'http://localhost:3000',
  'http://localhost:3001',
]

export function checkOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')

  // En production, Origin ou Referer doit matcher
  if (origin) return ALLOWED_ORIGINS.some(o => origin.startsWith(o))
  if (referer) return ALLOWED_ORIGINS.some(o => referer.startsWith(o))

  // Pas d'Origin ni Referer → requête serveur-à-serveur ou mobile, on accepte si Content-Type JSON
  // (les formulaires HTML ne peuvent pas envoyer application/json)
  const ct = req.headers.get('content-type') || ''
  return ct.includes('application/json')
}
