'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getProduits, Produit } from '@/lib/api'
import { getSession } from '@/lib/auth'

function getPastille(stock: number, seuil: number): { color: string; label: string } {
  if (stock <= seuil) return { color: 'bg-red-500', label: 'Alerte' }
  if (stock <= seuil + 10) return { color: 'bg-orange-500', label: 'Bas' }
  return { color: 'bg-green-500', label: 'OK' }
}

export default function StockPage() {
  const router = useRouter()
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const s = getSession()
    if (!s) { router.replace('/login'); return }
    getProduits(s.uid)
      .then(res => {
        const sorted = [...res.produits].sort((a, b) => {
          const aAlert = Number(a.stock_actuel) <= Number(a.seuil_alerte)
          const bAlert = Number(b.stock_actuel) <= Number(b.seuil_alerte)
          if (aAlert && !bAlert) return -1
          if (!aAlert && bAlert) return 1
          return a.nom.localeCompare(b.nom)
        })
        setProduits(sorted)
      })
      .catch(() => setError('Impossible de charger les produits.'))
      .finally(() => setLoading(false))
  }, [router])

  const filtered = produits.filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 py-4 space-y-3">
      {/* History shortcuts */}
      <div className="flex gap-2">
        <Link href="/dashboard/livraisons"
          className="flex-1 bg-gray-800 rounded-xl p-3 text-center text-sm font-medium text-brand border border-gray-700 active:scale-95 transition-transform">
          🚚 Historique livraisons
        </Link>
        <Link href="/dashboard/inventaires"
          className="flex-1 bg-gray-800 rounded-xl p-3 text-center text-sm font-medium text-gray-300 border border-gray-700 active:scale-95 transition-transform">
          📋 Historique inventaires
        </Link>
      </div>

      <input
        type="text"
        placeholder="Rechercher un produit…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand"
      />

      {loading && <p className="text-center text-gray-400 py-8">Chargement…</p>}
      {error && <p className="text-center text-red-400 py-8">{error}</p>}
      {!loading && filtered.length === 0 && !error && (
        <p className="text-center text-gray-500 py-8">Aucun produit</p>
      )}

      {filtered.map(p => {
        const stock = Number(p.stock_actuel)
        const seuil = Number(p.seuil_alerte)
        const { color: pastilleColor } = getPastille(stock, seuil)
        const isAlert = stock <= seuil

        return (
          <div
            key={p.uid}
            className={`rounded-xl p-4 border ${
              isAlert ? 'bg-red-950 border-red-800' : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left: name + seuil */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.nom}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Seuil : <span className="text-white">{seuil}</span>
                  {p.unite && <span className="ml-1 text-gray-500">{p.unite}</span>}
                </p>
              </div>

              {/* Right: pastille + stock */}
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <div className="text-right">
                  <p className={`text-2xl font-bold ${isAlert ? 'text-red-400' : 'text-white'}`}>
                    {stock}
                  </p>
                  <p className="text-xs text-gray-400">unités</p>
                </div>
                <div className={`w-3 h-3 rounded-full shrink-0 ${pastilleColor}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
