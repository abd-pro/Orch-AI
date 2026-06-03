import React from 'react'
import Link from 'next/link'
import { AI_MODELS } from '@/lib/types'
import OrchLogo from '@/components/OrchLogo'
import { GitCompare, Swords, Sparkles, ShieldAlert } from 'lucide-react'

const FEATURES = [
  {
    icon: GitCompare,
    title: 'Comparaison',
    desc: 'Plusieurs réponses en parallèle sur la même question',
  },
  {
    icon: Swords,
    title: 'Mode Débat',
    desc: 'Deux IA s\'affrontent sur un sujet, une troisième arbitre',
  },
  {
    icon: Sparkles,
    title: 'Arbitrage',
    desc: 'L\'orchestrateur désigne automatiquement la meilleure réponse',
  },
  {
    icon: ShieldAlert,
    title: 'Détection d\'erreurs',
    desc: 'Si les IA divergent, Orch.AI le signale — les réponses unanimes sont plus fiables',
    highlight: true,
  },
]

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl flex flex-col items-center text-center gap-10">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center gap-4">
          <OrchLogo size={52} />
          <div>
            <h1 className="text-2xl font-bold text-[var(--fg)]">
              Orch<span className="text-[#cf7d56]">.AI</span>
            </h1>
            <p className="text-[var(--mu2)] text-sm mt-1.5">
              Comparez les meilleures IA en un seul endroit
            </p>
          </div>
        </div>

        {/* Model badges */}
        <div className="flex flex-wrap justify-center gap-2">
          {AI_MODELS.map((m) => (
            <span
              key={m.provider}
              className="text-[11px] px-2.5 py-1 rounded-full border"
              style={{ color: m.color, borderColor: m.color + '40', backgroundColor: m.color + '12' }}
            >
              {m.name}
            </span>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {FEATURES.map(({ icon: Icon, title, desc, highlight }: { icon: React.ElementType, title: string, desc: string, highlight?: boolean }) => (
            <div
              key={title}
              className={`rounded-xl p-4 text-left border ${
                highlight
                  ? 'bg-[#cf7d56]/8 border-[#cf7d56]/30'
                  : 'bg-[var(--surface)] border-[var(--bdr)]'
              }`}
            >
              <Icon size={15} className="text-[#cf7d56] mb-2.5" />
              <p className="text-sm font-medium text-[var(--fg)]">{title}</p>
              <p className="text-xs text-[var(--mu3)] mt-1 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/chat"
          className="px-6 py-2.5 rounded-xl bg-[#cf7d56] hover:bg-[#b86a43] text-white text-sm font-medium transition-colors"
        >
          Commencer une conversation →
        </Link>

      </div>
    </div>
  )
}
