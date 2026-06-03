'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LogOut, Plus, Sun, Moon, PanelLeftClose, Home, ChevronDown, Search, X, Zap } from 'lucide-react'
import { creditsToTokens } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/providers/ThemeProvider'
import OrchLogo from '@/components/OrchLogo'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type UsageInfo = { plan: string; label: string; remaining: number; limit: number }

interface Props {
  user: SupabaseUser | null
  conversations?: { id: string; title: string }[]
  isAdmin?: boolean
  onCollapse?: () => void
}


export default function Sidebar({ user, conversations = [], isAdmin = false, onCollapse }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentConvId = searchParams.get('id')
  const { theme, toggle } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [usage, setUsage] = useState<UsageInfo | null>(null)

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.json())
      .then((d) => setUsage({ plan: d.plan, label: d.label, remaining: d.remaining, limit: d.limit }))
      .catch(() => {})
  }, [])

  async function saveTitle(id: string) {
    const trimmed = editTitle.trim()
    if (trimmed) {
      const supabase = createClient()
      await supabase.from('conversations').update({ title: trimmed }).eq('id', id)
      router.refresh()
    }
    setEditingId(null)
  }

  const li          = theme === 'light'
  const itemHover   = li ? 'hover:bg-[#bebebc]'  : 'hover:bg-[var(--surface)]'
  const itemActive  = li ? 'bg-[#bababf]'        : 'bg-[var(--sur2)]'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className={`w-60 h-full flex flex-col rounded-2xl shrink-0 overflow-hidden ${theme === 'light' ? 'bg-[#c8c8cc]' : 'bg-[#323236]'}`}>

      {/* Top icon row */}
      <div className="px-3 pt-3 pb-1 flex items-center gap-1">
        {onCollapse && (
          <button onClick={onCollapse} title="Réduire"
            className="p-1.5 rounded-md text-[var(--mu3)] hover:text-[var(--mu1)] hover:bg-[var(--sur2)] transition-colors">
            <PanelLeftClose size={15} />
          </button>
        )}
        <div className="flex-1 flex items-center justify-center">
          <OrchLogo size={26} />
        </div>
        <button onClick={toggle} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          className="p-1.5 rounded-md text-[var(--mu3)] hover:text-[var(--mu1)] hover:bg-[var(--sur2)] transition-colors">
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>


      {/* Nav actions */}
      <nav className="px-2 flex flex-col gap-0.5 pb-2">
        <Link href="/chat"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--mu2)] hover:text-[var(--fg)] ${itemHover} transition-colors`}>
          <Plus size={15} className="text-[var(--mu3)]" />
          Nouvelle conversation
        </Link>
        <Link href="/home"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/home'
              ? `text-[var(--fg)] ${itemActive}`
              : `text-[var(--mu2)] hover:text-[var(--fg)] ${itemHover}`
          }`}>
          <Home size={15} className="text-[var(--mu3)]" />
          Accueil
        </Link>
      </nav>

      {/* Recents */}
      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length > 0 && (
          <>
            <div className="flex items-center justify-between px-3 py-1.5 mb-0.5">
              <span className="text-[10px] text-[var(--mu3)] uppercase tracking-widest font-medium">Historique</span>
              <button
                onClick={() => { setShowSearch((v) => !v); setSearchQuery('') }}
                className="p-0.5 text-[var(--mu3)] hover:text-[var(--mu1)] transition-colors"
              >
                {showSearch ? <X size={11} /> : <Search size={11} />}
              </button>
            </div>
            {showSearch && (
              <div className="px-2 mb-1.5">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full bg-[var(--surface)] border border-[var(--bdr)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--fg)] placeholder:text-[var(--mu3)] focus:outline-none focus:border-[#cf7d56] transition-colors"
                />
              </div>
            )}
            {conversations.filter((conv) =>
              !searchQuery || conv.title.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((conv) => {
              const isActive = pathname === '/chat' && currentConvId === conv.id
              if (editingId === conv.id) {
                return (
                  <div key={conv.id} className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg ${itemActive}`}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 border border-[var(--fg)] bg-[var(--fg)]" />
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveTitle(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle(conv.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="flex-1 min-w-0 bg-transparent text-xs text-[var(--fg)] outline-none border-b border-[#cf7d56]"
                    />
                  </div>
                )
              }
              return (
                <Link key={conv.id} href={`/chat?id=${conv.id}`}
                  onDoubleClick={(e) => { e.preventDefault(); setEditingId(conv.id); setEditTitle(conv.title) }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive
                      ? `${itemActive} text-[var(--tx1)]`
                      : `text-[var(--mu2)] hover:text-[var(--fg)] ${itemHover}`
                  }`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 border ${
                    isActive ? 'border-[var(--fg)] bg-[var(--fg)]' : 'border-[var(--mu3)]'
                  }`} />
                  <span className="truncate">{conv.title}</span>
                </Link>
              )
            })}
          </>
        )}
      </div>

      {/* Compteur crédits */}
      {usage && usage.plan !== 'dev' && (
        <div className="px-3 pb-2">
          <Link href="/pricing" className="block">
            <div className={`rounded-xl px-3 py-2 border transition-colors hover:border-[#cf7d56]/50 ${li ? 'bg-[#bababf] border-[#aaaab0]' : 'bg-[var(--sur2)] border-[var(--bdr)]'}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap size={11} className="text-[#cf7d56]" />
                <span className="text-[10px] font-semibold text-[#cf7d56]">{usage.label}</span>
              </div>
              {usage.remaining !== Infinity && usage.limit !== Infinity && (
                <div className="h-1 rounded-full bg-[var(--bg)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#cf7d56] transition-all"
                    style={{ width: `${Math.min(100, (usage.remaining / usage.limit) * 100)}%` }}
                  />
                </div>
              )}
              {usage.remaining < 20 && usage.remaining !== Infinity && (
                <p className="text-[10px] text-[#cf7d56] mt-1">Upgrade pour continuer →</p>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div className="px-2 py-2">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl ${itemHover} transition-colors group`}>
              <div className="w-6 h-6 rounded-full bg-[#cf7d56]/20 border border-[#cf7d56]/30 flex items-center justify-center text-[10px] font-semibold text-[#cf7d56] shrink-0">
                {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
              </div>
              <span className="text-xs text-[var(--mu1)] truncate flex-1 text-left">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
              <ChevronDown size={13} className={`text-[var(--mu3)] shrink-0 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--surface)] border border-[var(--bdr)] rounded-xl p-1 shadow-lg">
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-[var(--mu2)] hover:text-red-400 hover:bg-red-400/8 transition-colors">
                  <LogOut size={13} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 px-1">
            <Link href="/login"
              className="block w-full text-center px-3 py-1.5 rounded-lg text-xs text-[var(--mu1)] border border-[var(--bdr)] hover:border-[var(--mu3)] hover:text-[var(--fg)] transition-colors">
              Se connecter
            </Link>
            <Link href="/register"
              className="block w-full text-center px-3 py-2 rounded-lg text-xs font-medium bg-[#cf7d56] hover:bg-[#b86a43] transition-colors text-white">
              Créer un compte
            </Link>
          </div>
        )}

        {/* Liens légaux */}
        <div className="flex justify-center gap-3 pt-1 pb-0.5">
          <Link href="/privacy" className="text-[9px] text-[var(--mu3)] hover:text-[var(--mu2)] transition-colors">Confidentialité</Link>
          <span className="text-[var(--mu3)] text-[9px]">·</span>
          <Link href="/terms" className="text-[9px] text-[var(--mu3)] hover:text-[var(--mu2)] transition-colors">CGU</Link>
        </div>
      </div>
    </aside>
  )
}
