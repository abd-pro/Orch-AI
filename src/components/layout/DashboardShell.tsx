'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { PanelLeftOpen, Menu } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Props {
  user: SupabaseUser | null
  conversations: { id: string; title: string }[]
  isAdmin: boolean
  children: React.ReactNode
}

export default function DashboardShell({ user, conversations, isAdmin, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  )

  return (
    <div className="flex h-full p-2 gap-2 bg-[var(--bg)]">

      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar : overlay sur mobile, inline sur desktop */}
      <div className={[
        'fixed top-2 bottom-2 left-2 z-50 transition-transform duration-300',
        'md:static md:z-auto md:h-full md:transition-none',
        sidebarOpen
          ? 'translate-x-0'
          : '-translate-x-[calc(100%+8px)] md:translate-x-0 md:hidden',
      ].join(' ')}>
        <Sidebar
          user={user}
          conversations={conversations}
          isAdmin={isAdmin}
          onCollapse={() => setSidebarOpen(false)}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Bouton ouverture : icône hamburger sur mobile, PanelLeftOpen sur desktop */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 left-3 z-10 p-1.5 rounded-md text-[var(--mu3)] hover:text-[var(--mu1)] hover:bg-[var(--sur2)] transition-colors"
            title="Ouvrir le panneau"
          >
            <Menu size={18} className="md:hidden" />
            <PanelLeftOpen size={14} className="hidden md:block" />
          </button>
        )}
        {children}
      </main>
    </div>
  )
}
