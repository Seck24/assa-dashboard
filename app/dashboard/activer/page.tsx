'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, clearSession } from '@/lib/auth'
import { activerParCapture } from '@/lib/api'

export default function ActiverPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const session = getSession()
  if (typeof window !== 'undefined' && !session) {
    router.replace('/login')
    return null
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError('')
    setSuccess('')
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !session) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await activerParCapture(session.uid, session.telephone, file)
      if (res.success) {
        setSuccess(res.message)
      } else {
        setError(res.message || 'Paiement non reconnu.')
      }
    } catch {
      setError('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-brand flex items-center justify-center mb-4">
            <span className="text-3xl">💳</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Activation du compte</h1>
          <p className="text-gray-400 text-sm mt-2">
            Effectuer un paiement Wave de <strong className="text-brand">15 000 FCFA</strong> au numéro ci-dessous pour obtenir un <strong className="text-brand">accès à vie</strong>.
          </p>
          <p className="text-2xl font-bold text-brand mt-3 tracking-wider">05 08 06 34 37</p>
          <p className="text-gray-500 text-xs mt-1">Envoyer la capture du reçu Wave ci-dessous</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Zone upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-600 hover:border-brand rounded-2xl p-6 text-center cursor-pointer transition-colors"
          >
            {preview ? (
              <img src={preview} alt="Capture" className="max-h-64 mx-auto rounded-xl" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <span className="text-4xl">📷</span>
                <p className="text-sm font-medium">Ajouter la capture du reçu</p>
                <p className="text-xs text-gray-500">JPG, PNG — reçu de paiement Wave</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />

          {preview && (
            <button
              type="button"
              onClick={() => { setFile(null); setPreview(null); setError(''); setSuccess('') }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Changer d&apos;image
            </button>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading || !!success}
            className="w-full bg-brand hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Vérification en cours...
              </span>
            ) : (
              'Envoyer la capture'
            )}
          </button>

          <button
            type="button"
            onClick={() => { clearSession(); router.replace('/login') }}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors text-center"
          >
            Retour à la connexion
          </button>
        </form>
      </div>
    </div>
  )
}
