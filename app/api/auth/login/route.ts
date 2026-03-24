import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { n8nPost } from '@/lib/n8n'

// 5 tentatives par 15 minutes par IP
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = rateLimit(ip, 'login', MAX_ATTEMPTS, WINDOW_MS)

  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfterMs / 60000)} minute(s).` },
      { status: 429 }
    )
  }

  try {
    const { telephone, mot_de_passe } = await req.json()

    if (!telephone || typeof telephone !== 'string' || !/^\+?\d{6,15}$/.test(telephone.replace(/[\s\-()]/g, ''))) {
      return NextResponse.json({ success: false, error: 'Numéro invalide' }, { status: 400 })
    }
    if (!mot_de_passe || typeof mot_de_passe !== 'string' || mot_de_passe.length < 4 || mot_de_passe.length > 128) {
      return NextResponse.json({ success: false, error: 'Mot de passe invalide' }, { status: 400 })
    }

    const data = await n8nPost<{ success: boolean; uid: string; nom_commerce: string; error?: string }>('login', {
      telephone,
      mot_de_passe,
    })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
