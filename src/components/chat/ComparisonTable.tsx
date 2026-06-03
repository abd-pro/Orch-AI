'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { AIResponse, AI_MODELS, type AIProvider, type Category } from '@/lib/types'
import FeedbackButtons from './FeedbackButtons'
import OrchLogo from '@/components/OrchLogo'

interface Props {
  responses: AIResponse[]
  arbitratorAI: string | null
  category: Category
  pendingProviders?: AIProvider[]
}

export default function ComparisonTable({ responses, arbitratorAI, category, pendingProviders = [] }: Props) {
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)

  const validResponses = responses.filter((r) => !r.error)
  const errorResponses = responses.filter((r) => r.error)

  return (
    <div className="mt-4 border border-[var(--sur2)] rounded-xl overflow-hidden">
      <div className="bg-[var(--surface)] px-4 py-3 border-b border-[var(--sur2)] flex items-center gap-3">
        <OrchLogo size={28} animated={pendingProviders.length > 0} />
        <h3 className="text-sm font-medium text-[var(--mu1)]">
          Comparaison des réponses ({validResponses.length + pendingProviders.length} IA)
          {pendingProviders.length > 0 && (
            <span className="ml-2 text-xs text-[var(--mu3)]">• {pendingProviders.length} en cours…</span>
          )}
          {arbitratorAI && (
            <span className="ml-2 text-xs text-[#cf7d56]">
              • Synthèse par {AI_MODELS.find((m) => m.provider === arbitratorAI)?.name ?? arbitratorAI}
            </span>
          )}
        </h3>
      </div>

      {/* Tableau résumé */}
      <div className="divide-y divide-[var(--sur2)]">
        {validResponses.map((response) => {
          const model = AI_MODELS.find((m) => m.provider === response.provider)
          const isExpanded = expandedProvider === response.provider
          const preview = response.content.slice(0, 180) + (response.content.length > 180 ? '...' : '')

          return (
            <div key={response.provider} className="bg-[var(--bg)]">
              {/* En-tête de ligne */}
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: model?.color ?? '#888' }}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium">{model?.name ?? response.provider}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <FeedbackButtons provider={response.provider as AIProvider} category={category} />
                      {response.durationMs && (
                        <span className="text-xs text-[var(--mu3)]">{(response.durationMs / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-[var(--mu1)] leading-relaxed">
                    {isExpanded ? response.content : preview}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedProvider(isExpanded ? null : response.provider)}
                  className="text-[var(--mu3)] hover:text-[var(--fg)] transition-colors shrink-0 mt-0.5"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>
          )
        })}

        {pendingProviders.map((provider) => {
          const model = AI_MODELS.find((m) => m.provider === provider)
          return (
            <div key={provider} className="flex items-center gap-3 px-4 py-3 bg-[#09090b]">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: (model?.color ?? '#888') + '88' }} />
              <span className="text-sm font-medium text-[var(--mu3)]">{model?.name ?? provider}</span>
              <span className="flex gap-1 ml-auto">
                <span className="w-1 h-1 rounded-full bg-[#52525b] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-[#52525b] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-[#52525b] animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          )
        })}

        {errorResponses.map((response) => {
          const model = AI_MODELS.find((m) => m.provider === response.provider)
          return (
            <div key={response.provider} className="flex items-center gap-3 px-4 py-3 bg-[#09090b]">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-red-500/50"></div>
              <span className="text-sm font-medium text-[#a1a1aa]">{model?.name ?? response.provider}</span>
              <span className="text-xs text-red-400 ml-auto">Erreur — clé manquante ou invalide</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
