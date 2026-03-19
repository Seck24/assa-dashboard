'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getInventaires, Inventaire } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { formatDate } from '@/lib/format'

function groupByDate(inventaires: Inventaire[]): { date: string; items: Inventaire[] }[] {
  const map = new Map<string, Inventaire[]>()
  for (const inv of inventaires) {
    const key = inv.date_inventaire?.slice(0, 10) ?? ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(inv)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }))
}

export default function InventairesPage() {
  const router = useRouter()
  const [inventaires, setInventaires] = useState<Inventaire[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/login'); return }
    getInventaires(s.uid)
      .then(r => setInventaires(r.inventaires))
      .catch(() => setError('Impossible de charger les inventaires.'))
      .finally(() => setLoading(false))
  }, [router])

  const grouped = groupByDate(inventaires)

  return (
    <div className="px-4 py-4 space-y-4">
      {loading && <p className="text-center text-gray-400 py-8">Chargement…</p>}
      {error && <p className="text-center text-red-400 py-8">{error}</p>}

      {!loading && inventaires.length === 0 && !error && (
        <p className="text-center text-gray-500 py-8">Aucun inventaire enregistré</p>
      )}

      {!loading && grouped.map(group => (
        <div key={group.date}>
          {/* En-tête de date */}
          <div className="px-1 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {formatDate(group.date)}
            </span>
          </div>

          {/* Inventaires du jour */}
          <div className="space-y-2">
            {group.items.map(inv => {
              const ecart = Number(inv.ecart)
              const ecartColor = ecart === 0 ? 'text-gray-400' : ecart > 0 ? 'text-green-400' : 'text-red-400'
              const ecartSign = ecart > 0 ? '+' : ''

              return (
                <div key={inv.id} className="bg-gray-800 rounded-xl p-4">
                  <p className="font-semibold text-sm mb-3">{inv.nom_produit}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-700 rounded-lg py-2">
                      <p className="text-xs text-gray-400">Actuel</p>
                      <p className="text-white font-bold">{Number(inv.stock_actuel)}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg py-2">
                      <p className="text-xs text-gray-400">Compté</p>
                      <p className="text-white font-bold">{Number(inv.stock_compte)}</p>
                    </div>
                    <div className={`bg-gray-700 rounded-lg py-2 ${ecart !== 0 ? 'ring-1 ring-inset ' + (ecart > 0 ? 'ring-green-500' : 'ring-red-500') : ''}`}>
                      <p className="text-xs text-gray-400">Écart</p>
                      <p className={`font-bold ${ecartColor}`}>{ecartSign}{ecart}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
