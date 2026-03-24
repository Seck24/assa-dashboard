import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { n8nPost } from '@/lib/n8n'

// 3 inscriptions par 30 minutes par IP
const MAX_ATTEMPTS = 3
const WINDOW_MS = 30 * 60 * 1000

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = rateLimit(ip, 'register', MAX_ATTEMPTS, WINDOW_MS)

  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: `Trop de tentatives. Réessayez dans ${Math.ceil(rl.retryAfterMs / 60000)} minute(s).` },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { telephone, mot_de_passe, nom_commerce, ville_commune, nom_complet, code_commercial } = body

    if (!telephone || !/^\+?\d{6,15}$/.test(telephone.replace(/[\s\-()]/g, ''))) {
      return NextResponse.json({ success: false, error: 'Numéro invalide' }, { status: 400 })
    }
    if (!mot_de_passe || mot_de_passe.length < 8 || mot_de_passe.length > 128) {
      return NextResponse.json({ success: false, error: 'Mot de passe min 8 caractères' }, { status: 400 })
    }
    if (!nom_commerce?.trim()) {
      return NextResponse.json({ success: false, error: 'Nom du commerce requis' }, { status: 400 })
    }

    const data = await n8nPost<{ success: boolean; uid?: string; nom_commerce?: string; error?: string; data?: { uid: string; nom_commerce: string } }>('inscription', {
      telephone,
      mot_de_passe,
      nom_commerce: nom_commerce.substring(0, 100),
      ville_commune: (ville_commune || '').substring(0, 50),
      nom_complet: (nom_complet || '').substring(0, 100),
      code_commercial: (code_commercial || '').substring(0, 20),
    })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
