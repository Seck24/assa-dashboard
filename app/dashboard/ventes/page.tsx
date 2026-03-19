'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRapport, Vente } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { formatMoney, today } from '@/lib/format'
import { useDateRange } from '@/lib/useDateRange'

const MEDALS = ['🥇', '🥈', '🥉', '4e', '5e']

export default function VentesPage() {
  const router = useRouter()
  const [ventes, setVentes] = useState<Vente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { dateDebut, dateFin, setDateDebut, setDateFin, setRange } = useDateRange('ventes')

  async function load(debut: string, fin: string) {
    const s = getSession()
    if (!s) { router.replace('/login'); return }
    setLoading(true)
    setError('')
    try {
      const r = await getRapport(s.uid, debut, fin)
      // Sort by quantite DESC for top 5
      const sorted = [...r.ventes].sort((a, b) => Number(b.quantite) - Number(a.quantite))
      setVentes(sorted)
    } catch {
      setError('Impossible de charger les ventes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(dateDebut, dateFin) }, [])

  const top5 = ventes.slice(0, 5)

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="space-y-2">
        <button
          onClick={() => { const t = today(); setRange(t, t); load(t, t) }}
          className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${dateDebut === today() && dateFin === today() ? 'text-green-400' : 'text-gray-500'}`}
        >
          Aujourd'hui
        </button>
        <form
          onSubmit={e => { e.preventDefault(); load(dateDebut, dateFin) }}
          className="flex gap-2 items-end"
        >
          <div className="flex-1">
            <label className="text-xs text-gray-400">Du</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400">Au</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand" />
          </div>
          <button type="submit" className="bg-brand text-gray-950 font-bold rounded-lg px-4 py-2 text-sm active:scale-95 transition-transform">OK</button>
        </form>
      </div>

      {loading && <p className="text-center text-gray-400 py-8">Chargement…</p>}
      {error && <p className="text-center text-red-400 py-8">{error}</p>}

      {/* TOP 5 card */}
      {!loading && top5.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-300 mb-3">Top 5 produits vendus</p>
          <div className="space-y-2">
            {top5.map((v, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base w-6 text-center">{MEDALS[i]}</span>
                  <span className="text-sm text-white">{v.nom_affiche}</span>
                </div>
                <span className="text-brand font-bold text-sm">x{Number(v.quantite)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && ventes.length === 0 && !error && (
        <p className="text-center text-gray-500 py-8">Aucune vente sur cette période</p>
      )}

      {/* All products detail */}
      {ventes.map((v, i) => (
        <div key={i} className="bg-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="font-semibold text-sm flex-1 truncate">{v.nom_affiche}</p>
            <span className="text-xs text-gray-400 ml-2 shrink-0">x{Number(v.quantite)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400">CA</p>
              <p className="text-brand font-bold text-sm">{formatMoney(Number(v.sous_total))}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Marge</p>
              <p className="text-green-400 font-bold text-sm">{formatMoney(Number(v.marge))}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
