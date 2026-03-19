'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRapport, Depense } from '@/lib/api'
import { getSession } from '@/lib/auth'
import { formatMoney, formatDate, today } from '@/lib/format'
import { useDateRange } from '@/lib/useDateRange'

function groupByDate(depenses: Depense[]): { date: string; items: Depense[]; total: number }[] {
  const map = new Map<string, Depense[]>()
  for (const d of depenses) {
    const key = d.date_depense?.slice(0, 10) ?? ''
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(d)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({
      date,
      items,
      total: items.reduce((s, d) => s + Number(d.montant), 0),
    }))
}

export default function DepensesPage() {
  const router = useRouter()
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { dateDebut, dateFin, setDateDebut, setDateFin, setRange } = useDateRange('depenses')

  async function load(debut: string, fin: string) {
    const s = getSession()
    if (!s) { router.replace('/login'); return }
    setLoading(true)
    setError('')
    try {
      const r = await getRapport(s.uid, debut, fin)
      setDepenses(r.depenses)
      setTotal(Number(r.total_depenses))
    } catch {
      setError('Impossible de charger les dépenses.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(dateDebut, dateFin) }, [])

  const grouped = groupByDate(depenses)

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
          <button type="submit" className="bg-brand text-gray-950 font-bold rounded-lg px-4 py-2 text-sm active:scale-95 transition-transform">OK</button>
        </form>
      </div>

      {!loading && !error && (
        <div className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
          <span className="text-sm text-gray-400">{depenses.length} dépense{depenses.length > 1 ? 's' : ''}</span>
          <span className="text-red-400 font-bold text-lg">{formatMoney(total)}</span>
        </div>
      )}

      {loading && <p className="text-center text-gray-400 py-8">Chargement…</p>}
      {error && <p className="text-center text-red-400 py-8">{error}</p>}

      {!loading && depenses.length === 0 && !error && (
        <p className="text-center text-gray-500 py-8">Aucune dépense sur cette période</p>
      )}

      {!loading && grouped.map(group => (
        <div key={group.date}>
          {/* En-tête de date */}
          <div className="flex justify-between items-center px-1 mb-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {formatDate(group.date)}
            </span>
            <span className="text-xs text-red-400 font-semibold">{formatMoney(group.total)}</span>
          </div>

          {/* Dépenses du jour */}
          <div className="space-y-2">
            {group.items.map((d, i) => (
              <div key={d.uid ?? i} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{d.description || <span className="text-gray-500 italic">Sans description</span>}</p>
                  {d.categorie && <p className="text-xs text-gray-500 mt-0.5">{d.categorie}</p>}
                </div>
                <span className="text-red-400 font-bold">{formatMoney(Number(d.montant))}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
