import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { n8nPost } from '@/lib/n8n'
import { checkOrigin } from '@/lib/csrf'

// 3 tentatives par 15 minutes par IP
const MAX_ATTEMPTS = 3
const WINDOW_MS = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ success: false, message: 'Origine non autorisée' }, { status: 403 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = rateLimit(ip, 'reset', MAX_ATTEMPTS, WINDOW_MS)

  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, message: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfterMs / 60000)} minute(s).` },
      { status: 429 }
    )
  }

  try {
    const { telephone, mot_de_passe } = await req.json()

    if (!telephone || !/^\+?\d{6,15}$/.test(telephone.replace(/[\s\-()]/g, ''))) {
      return NextResponse.json({ success: false, message: 'Numéro invalide' }, { status: 400 })
    }
    if (!mot_de_passe || mot_de_passe.length < 8 || mot_de_passe.length > 128) {
      return NextResponse.json({ success: false, message: 'Mot de passe min 8 caractères' }, { status: 400 })
    }

    const data = await n8nPost<{ success: boolean; message: string }>('reset-password', {
      telephone,
      mot_de_passe,
    })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 })
  }
}
