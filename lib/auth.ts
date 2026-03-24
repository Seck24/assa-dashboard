const SESSION_KEY = 'assa_session'
const SESSION_TTL = 24 * 60 * 60 * 1000 // 24 heures

export interface Session {
  uid: string
  nom_commerce: string
  telephone: string
}

interface StoredSession extends Session {
  expiresAt: number
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const stored: StoredSession = JSON.parse(raw)
    if (Date.now() > stored.expiresAt) {
      clearSession()
      return null
    }
    return { uid: stored.uid, nom_commerce: stored.nom_commerce, telephone: stored.telephone }
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  const stored: StoredSession = { ...session, expiresAt: Date.now() + SESSION_TTL }
  localStorage.setItem(SESSION_KEY, JSON.stringify(stored))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
