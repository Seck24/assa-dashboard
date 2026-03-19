'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLivraisons, Livraison } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { formatDate } from '@/lib/format'

export default function LivraisonsPage() {
  const router = useRouter()
  const [livraisons, setLivraisons] = useState<Livraison[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/login'); return }
    getLivraisons(s.uid)
      .then(r => setLivraisons(r.livraisons))
      .catch(() => setError('Impossible de charger les livraisons.'))
      .finally(() => setLoading(false))
  }, [router])

  // Group by date, then merge same product within a day
  const grouped: { date: string; items: { nom_produit: string; quantite: number }[] }[] = []
  for (const l of livraisons) {
    const date = formatDate(l.date_livraison)
    let dateGroup = grouped.find(g => g.date === date)
    if (!dateGroup) {
      dateGroup = { date, items: [] }
      grouped.push(dateGroup)
    }
    const existing = dateGroup.items.find(i => i.nom_produit === l.nom_produit)
    if (existing) existing.quantite += Number(l.quantite)
    else dateGroup.items.push({ nom_produit: l.nom_produit, quantite: Number(l.quantite) })
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {loading && <p className="text-center text-gray-400 py-8">Chargement…</p>}
      {error && <p className="text-center text-red-400 py-8">{error}</p>}

      {!loading && livraisons.length === 0 && !error && (
        <p className="text-center text-gray-500 py-8">Aucune livraison enregistrée</p>
      )}

      {grouped.map(group => (
        <div key={group.date} className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-semibold mb-3">{group.date}</p>
          <div className="space-y-2">
            {group.items.map(item => (
              <div key={item.nom_produit} className="flex items-center justify-between">
                <p className="text-sm text-white">{item.nom_produit}</p>
                <div className="text-right ml-3 shrink-0">
                  <span className="text-brand font-bold">+{item.quantite}</span>
                  <span className="text-xs text-gray-400 ml-1">unités</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
