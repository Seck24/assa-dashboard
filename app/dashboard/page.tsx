'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRapport, resetPassword, checkAccess, effacerDonnees, Rapport } from '@/lib/api'
import { getSession, clearSession } from '@/lib/auth'
import { formatMoney, today } from '@/lib/format'
import { useDateRange } from '@/lib/useDateRange'

// Numéro WhatsApp Préo IA (sans +)
const PREO_WA = '2250508063437'

export default function DashboardHome() {
  const router = useRouter()
  const [rapport, setRapport] = useState<Rapport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { dateDebut, dateFin, setDateDebut, setDateFin, setRange } = useDateRange('accueil')

  // Activation ASSA
  const [assaActif, setAssaActif] = useState<boolean | null>(null)

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
      // Recalcul frontend : CA total - dépenses
      const ca = (r.ventes ?? []).reduce((s, v) => s + Number(v.sous_total), 0)
      r.benefice_net = ca - Number(r.total_depenses)
      setRapport(r)
    } catch {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }

  async function loadAccess() {
    const s = getSession()
    if (!s) return
    try {
      const res = await checkAccess(s.uid)
      setAssaActif(res.access_granted)
    } catch {
      setAssaActif(false)
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

  function buildWaLink() {
    const s = getSession()
    if (!s) return '#'
    const msg = `Bonjour, je souhaite activer mon compte ASSA. Voici mes identifiants nom de commerce: ${s.nom_commerce} et N° tel. ${s.telephone}. Je joins ma capture d'écran du paiement.`
    return `https://wa.me/${PREO_WA}?text=${encodeURIComponent(msg)}`
  }

  useEffect(() => {
    load(dateDebut, dateFin)
    loadAccess()
  }, [])

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Activer ASSA */}
      {assaActif !== null && (
        assaActif ? (
          <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-green-400 text-lg">✓</span>
            <span className="text-sm text-gray-400">Compte ASSA activé</span>
          </div>
        ) : (
          <a
            href={buildWaLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl px-4 py-3 text-sm active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Activer mon compte ASSA
          </a>
        )
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

          {/* CA + Dépenses */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Chiffre d'affaires" value={formatMoney(rapport.benefice_net + rapport.total_depenses)} color="text-brand" />
            <KpiCard label="Dépenses" value={formatMoney(rapport.total_depenses)} color="text-red-400" />
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
