'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    router.push('/home')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-1">Connexion</h1>
        <p className="text-sm text-[#a1a1aa] mb-8">Bon retour sur orch.AI</p>

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

          <div>
            <label className="block text-sm font-medium mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-[#a1a1aa] mt-6">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-[#cf7d56] hover:text-[#b86a43] font-medium transition-colors">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
