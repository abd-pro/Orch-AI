'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PasswordField from '@/components/PasswordField'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Si email de confirmation requis
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    router.push('/chat')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      {success ? (
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✉️</span>
          </div>
          <h2 className="text-xl font-bold mb-2">Vérifie ta boîte mail</h2>
          <p className="text-sm text-[#a1a1aa]">
            Un email de confirmation a été envoyé à <strong className="text-white">{email}</strong>.
            Clique sur le lien pour activer ton compte.
          </p>
        </div>
      ) : (
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-1">Créer un compte</h1>
        <p className="text-sm text-[#a1a1aa] mb-8">Accès illimité à orch.AI</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Votre nom"
              className="w-full bg-[#09090b] border border-[#3f3f46] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#cf7d56] transition-colors placeholder:text-[#52525b]"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium mb-1.5">Mot de passe</label>
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="8 caractères minimum"
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
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
      </div>
      )}

      <p className="text-center text-sm text-[#a1a1aa] mt-6">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-[#cf7d56] hover:text-[#b86a43] font-medium transition-colors">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
