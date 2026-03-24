'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRapport, resetPassword, effacerDonnees, Rapport } from '@/lib/api'
import { getSession, clearSession } from '@/lib/auth'
import { formatMoney, today } from '@/lib/format'
import { useDateRange } from '@/lib/useDateRange'

export default function DashboardHome() {
  const router = useRouter()
  const [rapport, setRapport] = useState<Rapport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { dateDebut, dateFin, setDateDebut, setDateFin, setRange } = useDateRange('accueil')
  const [justActivated, setJustActivated] = useState(false)

  // Effacer données
  const [confirmEffacer, setConfirmEffacer] = useState(false)
  const [effacerLoading, setEffacerLoading] = useState(false)

  // Changer mdp
  const [showMdp, setShowMdp] = useState(false)
  const [newMdp, setNewMdp] = useState('')
  const [confirmMdp, setConfirmMdp] = useState('')
  const [mdpLoading, setMdpLoading] = useState(false)
  const [mdpMsg, setMdpMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function load(debut: string, fin: string) {
    const s = getSession()
    if (!s) { router.replace('/login'); return }
    setLoading(true)
    setError('')
    try {
      const r = await getRapport(s.uid, debut, fin)
      r.total_marge = Number(r.total_marge)
      r.total_depenses = Number(r.total_depenses)
      // CA = somme des sous-totaux ventes
      const ca = (r.ventes ?? []).reduce((s, v) => s + Number(v.sous_total), 0)
      r.chiffre_affaires = ca
      // Bénéfice net = marge brute - dépenses
      r.benefice_net = r.total_marge - r.total_depenses
      setRapport(r)
    } catch {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }

  async function handleChangeMdp(e: React.FormEvent) {
    e.preventDefault()
    setMdpMsg(null)
    if (newMdp.length < 4) { setMdpMsg({ ok: false, text: 'Mot de passe trop court (min 4 caractères).' }); return }
    if (newMdp !== confirmMdp) { setMdpMsg({ ok: false, text: 'Les mots de passe ne correspondent pas.' }); return }
    const s = getSession()
    if (!s) return
    setMdpLoading(true)
    try {
      await resetPassword(s.telephone, newMdp)
      setMdpMsg({ ok: true, text: 'Mot de passe mis à jour. Le gérant devra se reconnecter.' })
      setNewMdp('')
      setConfirmMdp('')
      setShowMdp(false)
    } catch {
      setMdpMsg({ ok: false, text: 'Erreur lors du changement.' })
    } finally {
      setMdpLoading(false)
    }
  }

  useEffect(() => {
    load(dateDebut, dateFin)
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('activated') === '1') {
      setJustActivated(true)
      setTimeout(() => setJustActivated(false), 8000)
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Message de bienvenue après activation */}
      {justActivated && (
        <div className="bg-green-500/15 border border-green-500/30 rounded-xl px-4 py-4 flex flex-col gap-1 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">🎉</span>
            <span className="text-base text-green-400 font-bold">Compte activé avec succès !</span>
          </div>
          <p className="text-green-400/70 text-xs ml-8">Bienvenue sur ASSA. Bonne gestion !</p>
        </div>
      )}

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

      {rapport && !loading && (
        <>
          {/* Bénéfice net */}
          <div className="bg-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">Bénéfice net</p>
            <p className={`text-3xl font-bold ${rapport.benefice_net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatMoney(rapport.benefice_net)}
            </p>
          </div>

          {/* CA + Marge brute */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Chiffre d'affaires" value={formatMoney(rapport.chiffre_affaires ?? 0)} color="text-brand" />
            <KpiCard label="Marge brute" value={formatMoney(rapport.total_marge)} color="text-green-400" />
          </div>

          {/* Dépenses */}
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Dépenses</p>
            <p className="text-xl font-bold text-red-400">{formatMoney(rapport.total_depenses)}</p>
          </div>
        </>
      )}

      {/* Changer mot de passe gérant */}
      <div className="bg-gray-800 rounded-xl p-4">
        <button
          onClick={() => { setShowMdp(!showMdp); setMdpMsg(null) }}
          className="w-full flex items-center justify-between"
        >
          <span className="text-sm font-semibold text-white">Changer le mot de passe</span>
          <span className="text-gray-400 text-lg">{showMdp ? '▲' : '▼'}</span>
        </button>

        {showMdp && (
          <form onSubmit={handleChangeMdp} className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-gray-400">Nouveau mot de passe</label>
              <input type="password" value={newMdp} onChange={e => setNewMdp(e.target.value)}
                placeholder="Nouveau mdp"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Confirmer</label>
              <input type="password" value={confirmMdp} onChange={e => setConfirmMdp(e.target.value)}
                placeholder="Confirmer mdp"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand mt-1" />
            </div>
            {mdpMsg && (
              <p className={`text-xs ${mdpMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{mdpMsg.text}</p>
            )}
            <button type="submit" disabled={mdpLoading}
              className="w-full bg-brand text-gray-950 font-bold rounded-lg py-2 text-sm active:scale-95 transition-transform disabled:opacity-50">
              {mdpLoading ? 'Mise à jour…' : 'Confirmer le changement'}
            </button>
          </form>
        )}
      </div>

      {/* Effacer les données */}
      <button
        onClick={async () => {
          if (!confirmEffacer) {
            setConfirmEffacer(true)
            setTimeout(() => setConfirmEffacer(false), 5000)
            return
          }
          const s = getSession()
          if (!s) return
          setEffacerLoading(true)
          try {
            await effacerDonnees(s.uid)
            setConfirmEffacer(false)
            load(dateDebut, dateFin)
          } catch {
            setConfirmEffacer(false)
          } finally {
            setEffacerLoading(false)
          }
        }}
        disabled={effacerLoading}
        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${
          confirmEffacer
            ? 'bg-red-600 text-white'
            : 'bg-gray-800 text-red-400'
        }`}
      >
        {effacerLoading ? 'Suppression…' : confirmEffacer ? '⚠️ Confirmer — effacer ventes & dépenses ?' : 'Effacer les données'}
      </button>

      {/* Logout */}
      <button
        onClick={() => { clearSession(); router.replace('/login') }}
        className="w-full text-gray-500 text-sm py-3"
      >
        Déconnexion
      </button>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
