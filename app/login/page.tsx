'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, inscription } from '@/lib/api'
import { saveSession } from '@/lib/auth'
import { PAYS, buildPhone } from '@/lib/pays'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-brand"
      />
      <button type="button" onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

function PhoneInput({ code, onCode, local, onLocal }: {
  code: string; onCode: (c: string) => void
  local: string; onLocal: (n: string) => void
}) {
  return (
    <div className="flex gap-2">
      <select
        value={code}
        onChange={e => onCode(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-xl px-2 py-3 text-white text-sm focus:outline-none focus:border-brand w-28 shrink-0"
      >
        {PAYS.map(p => (
          <option key={p.code} value={p.code}>{p.flag} {p.code}</option>
        ))}
      </select>
      <input
        type="tel"
        value={local}
        onChange={e => onLocal(e.target.value)}
        placeholder="0X XX XX XX XX"
        required
        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand"
      />
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')

  // Login
  const [lCode, setLCode] = useState('+225')
  const [lLocal, setLLocal] = useState('')
  const [lMdp, setLMdp] = useState('')
  const [lError, setLError] = useState('')
  const [lLoading, setLLoading] = useState(false)

  // Register
  const [rCode, setRCode] = useState('+225')
  const [rLocal, setRLocal] = useState('')
  const [rMdp, setRMdp] = useState('')
  const [rNom, setRNom] = useState('')
  const [rVille, setRVille] = useState('')
  const [rError, setRError] = useState('')
  const [rLoading, setRLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLError('')
    setLLoading(true)
    const telephone = buildPhone(lCode, lLocal)
    try {
      const res = await login(telephone, lMdp)
      if (!res.success) { setLError('Téléphone ou mot de passe incorrect.'); return }
      saveSession({ uid: res.uid, nom_commerce: res.nom_commerce, telephone })
      router.replace('/dashboard')
    } catch {
      setLError('Erreur de connexion. Vérifiez votre réseau.')
    } finally {
      setLLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRError('')
    if (rMdp.length < 4) { setRError('Mot de passe trop court (min 4 caractères).'); return }
    setRLoading(true)
    const telephone = buildPhone(rCode, rLocal)
    try {
      const res = await inscription(telephone, rMdp, rNom, rVille)
      if (!res.success) { setRError(res.error || "Erreur lors de l'inscription."); return }
      saveSession({ uid: res.uid, nom_commerce: res.nom_commerce, telephone })
      router.replace('/dashboard')
    } catch {
      setRError('Erreur de connexion. Vérifiez votre réseau.')
    } finally {
      setRLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand">ASSA</h1>
          <p className="text-gray-400 mt-1 text-sm">Tableau de bord propriétaire</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-gray-800 rounded-xl p-1">
          <button onClick={() => setTab('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'login' ? 'bg-brand text-gray-950' : 'text-gray-400'}`}>
            Se connecter
          </button>
          <button onClick={() => setTab('register')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'register' ? 'bg-brand text-gray-950' : 'text-gray-400'}`}>
            Créer un compte
          </button>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Téléphone</label>
              <PhoneInput code={lCode} onCode={setLCode} local={lLocal} onLocal={setLLocal} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
              <PasswordInput value={lMdp} onChange={setLMdp} placeholder="••••••••" />
            </div>
            {lError && <p className="text-red-400 text-sm text-center">{lError}</p>}
            <button type="submit" disabled={lLoading}
              className="w-full bg-brand text-gray-950 font-bold rounded-xl py-3 mt-2 disabled:opacity-50 active:scale-95 transition-transform">
              {lLoading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">N° téléphone</label>
              <PhoneInput code={rCode} onCode={setRCode} local={rLocal} onLocal={setRLocal} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
              <PasswordInput value={rMdp} onChange={setRMdp} placeholder="Min 4 caractères" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom du commerce</label>
              <input type="text" value={rNom} onChange={e => setRNom(e.target.value)}
                placeholder="Ex : Maquis Chez Dédé" required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ville / Commune</label>
              <input type="text" value={rVille} onChange={e => setRVille(e.target.value)}
                placeholder="Ex : Yopougon" required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand" />
            </div>
            {rError && <p className="text-red-400 text-sm text-center">{rError}</p>}
            <button type="submit" disabled={rLoading}
              className="w-full bg-brand text-gray-950 font-bold rounded-xl py-3 mt-2 disabled:opacity-50 active:scale-95 transition-transform">
              {rLoading ? 'Inscription…' : 'Créer le compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
