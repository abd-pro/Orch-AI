'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('8 caractères minimum.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError('Lien expiré ou invalide. Redemandez un email de réinitialisation.'); return }
    setDone(true)
    setTimeout(() => { router.push('/chat'); router.refresh() }, 1500)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-1">Nouveau mot de passe</h1>
        <p className="text-sm text-[#a1a1aa] mb-8">Choisissez un nouveau mot de passe pour votre compte.</p>

        {done ? (
          <p className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2.5">
            ✅ Mot de passe mis à jour. Redirection...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="8 caractères minimum"
                className="w-full bg-[#09090b] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#cf7d56] transition-colors placeholder:text-[#52525b]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Confirmer</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#09090b] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#cf7d56] transition-colors placeholder:text-[#52525b]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#cf7d56] hover:bg-[#b86a43] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg py-2.5 text-sm font-semibold mt-2"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
