/**
 * Rate limiting simple en mémoire (par IP)
 * Suffisant pour un VPS mono-instance
 */

const store = new Map<string, { count: number; resetAt: number }>()

// Nettoyage périodique toutes les 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const keys = Array.from(store.keys())
    keys.forEach(key => {
      const val = store.get(key)
      if (val && now > val.resetAt) store.delete(key)
    })
  }, 5 * 60 * 1000)
}

export function rateLimit(
  ip: string,
  endpoint: string,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const key = `${endpoint}:${ip}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 }
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: maxAttempts - entry.count, retryAfterMs: 0 }
}
