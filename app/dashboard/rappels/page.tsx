'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStatsServeurs, StatServeur } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { formatMoney, today } from '@/lib/format'
import { useDateRange } from '@/lib/useDateRange'

export default function ServeursPage() {
  const router = useRouter()
  const [serveurs, setServeurs] = useState<StatServeur[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { dateDebut, dateFin, setDateDebut, setDateFin, setRange } = useDateRange('serveurs')

  async function load(debut: string, fin: string) {
    const s = getSession()
    if (!s) { router.replace('/login'); return }
    setLoading(true)
    setError('')
    try {
      const r = await getStatsServeurs(s.uid, debut, fin)
      const raw = r.serveurs
      const list: StatServeur[] = Array.isArray(raw)
        ? raw
        : typeof raw === 'string' ? JSON.parse(raw) : []
      setServeurs(list.filter(s => s.nom_serveur))
    } catch {
      setError('Impossible de charger les stats serveurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(dateDebut, dateFin) }, [])

  const caTotal = serveurs.reduce((sum, s) => sum + Number(s.ca_total), 0)

  return (
    <div className="px-4 py-4 space-y-3">

      {/* Date filter */}
      <div className="space-y-2">
        <button
          onClick={() => { const t = today(); setRange(t, t); load(t, t) }}
          className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${dateDebut === today() && dateFin === today() ? 'text-green-400' : 'text-gray-500'}`}
        >
          Aujourd'hui
        </button>
        <form onSubmit={e => { e.preventDefault(); load(dateDebut, dateFin) }} className="flex gap-2 items-end">
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
          <button type="submit"
            className="bg-brand text-gray-950 font-bold rounded-lg px-4 py-2 text-sm active:scale-95 transition-transform">
            OK
          </button>
        </form>
      </div>

      {loading && <p className="text-center text-gray-400 py-8">Chargement…</p>}
      {error && <p className="text-center text-red-400 py-8">{error}</p>}

      {!loading && !error && serveurs.length === 0 && (
        <p className="text-center text-gray-500 py-8">Aucune vente sur cette période</p>
      )}

      {/* Total CA */}
      {!loading && serveurs.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
          <span className="text-xs text-gray-400">CA total encaissé</span>
          <span className="text-brand font-bold text-lg">{formatMoney(caTotal)}</span>
        </div>
      )}

      {/* Carte par serveur */}
      {!loading && serveurs.map((s, i) => (
        <div key={i} className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Serveur</span>
            <span className="text-xs text-gray-500">{Number(s.nb_ventes)} vente{Number(s.nb_ventes) > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm">{s.nom_serveur || '—'}</span>
            <span className="text-brand font-bold text-base">{formatMoney(Number(s.ca_total))}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
