'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (error) { setError("Impossible d'envoyer l'email. Réessayez."); return }
    setSent(true)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-1">Mot de passe oublié</h1>
        <p className="text-sm text-[#a1a1aa] mb-8">
          {sent
            ? 'Consultez votre boîte mail.'
            : 'Entrez votre email, nous vous envoyons un lien de réinitialisation.'}
        </p>

        {sent ? (
          <p className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2.5 leading-relaxed">
            ✉️ Si un compte existe pour <span className="font-medium">{email}</span>, un email de réinitialisation vient d'être envoyé. Cliquez le lien pour choisir un nouveau mot de passe.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
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
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-[#a1a1aa] mt-6">
        <Link href="/login" className="text-[#cf7d56] hover:text-[#b86a43] font-medium transition-colors">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  )
}
