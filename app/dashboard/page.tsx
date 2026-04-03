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

      {/* ── Date filter ──────────────────────────────────── */}
      <div className="space-y-2">
        <button
          onClick={() => { const t = today(); setRange(t, t); load(t, t) }}
          className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
          style={{
            fontFamily: 'Manrope, sans-serif',
            color: dateDebut === today() && dateFin === today() ? '#00c853' : '#494847',
            background: dateDebut === today() && dateFin === today() ? 'rgba(0,200,83,0.12)' : 'transparent',
          }}
        >
          Aujourd'hui
        </button>
        <form onSubmit={e => { e.preventDefault(); load(dateDebut, dateFin) }} className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: '#494847', fontFamily: 'Inter, sans-serif' }}>Du</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ background: '#1a1919', border: '1px solid rgba(255,255,255,0.07)', color: '#fff' }} />
          </div>
          <div className="flex-1">
            <label className="text-xs mb-1 block" style={{ color: '#494847', fontFamily: 'Inter, sans-serif' }}>Au</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ background: '#1a1919', border: '1px solid rgba(255,255,255,0.07)', color: '#fff' }} />
          </div>
          <button type="submit"
            className="font-bold rounded-full px-5 py-2 text-sm active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg,#00e676,#00a650)', color: '#000', fontFamily: 'Manrope, sans-serif' }}>
            OK
          </button>
        </form>
      </div>

      {loading && <p className="text-center py-8" style={{ color: '#777575' }}>Chargement…</p>}
      {error && <p className="text-center text-red-400 py-8">{error}</p>}

      {rapport && !loading && (
        <>
          {/* ── Hero card — Bénéfice net ─────────────────── */}
          <div className="relative overflow-hidden rounded-2xl p-5" style={{
            background: '#1a1919',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 24px 48px rgba(0,0,0,0.4)',
          }}>
            <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }} />
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#777575', fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em' }}>Bénéfice net</p>
            <p style={{
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 800,
              fontSize: '2.4rem',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: rapport.benefice_net >= 0 ? '#00c853' : '#ff5252',
            }}>
              {formatMoney(rapport.benefice_net)}
            </p>
          </div>

          {/* ── CA + Marge ───────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Chiffre d'affaires" value={formatMoney(rapport.chiffre_affaires ?? 0)} color="#00c853" />
            <KpiCard label="Marge brute" value={formatMoney(rapport.total_marge)} color="#00e676" />
          </div>

          {/* ── Dépenses ─────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl px-5 py-4" style={{
            background: '#1a1919',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
          }}>
            <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }} />
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#777575', fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em' }}>Dépenses</p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1.6rem', color: '#ff5252', letterSpacing: '-0.01em' }}>
              {formatMoney(rapport.total_depenses)}
            </p>
          </div>
        </>
      )}

      {/* ── Changer mot de passe ─────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1a1919', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => { setShowMdp(!showMdp); setMdpMsg(null) }}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '0.875rem', color: '#ffffff' }}>Changer le mot de passe</span>
          <span style={{ color: '#777575' }}>{showMdp ? '▲' : '▼'}</span>
        </button>

        {showMdp && (
          <form onSubmit={handleChangeMdp} className="px-5 pb-5 space-y-3">
            <div>
              <label className="text-xs" style={{ color: '#777575', fontFamily: 'Inter, sans-serif' }}>Nouveau mot de passe</label>
              <input type="password" value={newMdp} onChange={e => setNewMdp(e.target.value)}
                placeholder="Nouveau mdp"
                className="w-full rounded-xl px-4 py-3 text-sm mt-1 focus:outline-none"
                style={{ background: '#262626', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
            </div>
            <div>
              <label className="text-xs" style={{ color: '#777575', fontFamily: 'Inter, sans-serif' }}>Confirmer</label>
              <input type="password" value={confirmMdp} onChange={e => setConfirmMdp(e.target.value)}
                placeholder="Confirmer mdp"
                className="w-full rounded-xl px-4 py-3 text-sm mt-1 focus:outline-none"
                style={{ background: '#262626', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
            </div>
            {mdpMsg && (
              <p className={`text-xs ${mdpMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{mdpMsg.text}</p>
            )}
            <button type="submit" disabled={mdpLoading}
              className="w-full font-bold rounded-full py-3 text-sm active:scale-95 transition-transform disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#00e676,#00a650)', color: '#000', fontFamily: 'Manrope, sans-serif' }}>
              {mdpLoading ? 'Mise à jour…' : 'Confirmer le changement'}
            </button>
          </form>
        )}
      </div>

      {/* ── Effacer les données ───────────────────────────── */}
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
        className="w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
        style={confirmEffacer
          ? { background: '#b91c1c', color: '#fff' }
          : { background: '#1a1919', color: '#ef4444', boxShadow: '0 0 0 1px rgba(255,255,255,0.05)' }}
      >
        {effacerLoading ? 'Suppression…' : confirmEffacer ? '⚠️ Confirmer — effacer ventes & dépenses ?' : 'Effacer les données'}
      </button>

      {/* ── Logout ───────────────────────────────────────── */}
      <button
        onClick={() => { clearSession(); router.replace('/login') }}
        className="w-full text-sm py-3"
        style={{ color: '#494847', fontFamily: 'Inter, sans-serif' }}
      >
        Déconnexion
      </button>
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4" style={{
      background: '#1a1919',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
    }}>
      <div className="absolute top-0 left-[8%] right-[8%] h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)' }} />
      <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#777575', fontFamily: 'Inter, sans-serif', letterSpacing: '0.10em' }}>{label}</p>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1.4rem', color, letterSpacing: '-0.01em' }}>{value}</p>
    </div>
  )
}
