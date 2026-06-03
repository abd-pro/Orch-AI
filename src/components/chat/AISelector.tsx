'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { AI_MODELS, CATEGORY_LABELS, RECOMMENDED_AIS, type AIProvider, type Category } from '@/lib/types'

interface Props {
  selectedAIs: AIProvider[]
  onToggle: (provider: AIProvider) => void
  category: Category
  onCategoryChange: (category: Category) => void
  allowedAIs?: AIProvider[]   // IA autorisées par le plan (undefined = toutes)
  maxAIs?: number              // nb max simultané (undefined = illimité)
}

export default function AISelector({ selectedAIs, onToggle, category, onCategoryChange, allowedAIs, maxAIs }: Props) {
  const atMax = maxAIs !== undefined && selectedAIs.length >= maxAIs

  function handleToggle(provider: AIProvider) {
    const isAllowed = !allowedAIs || allowedAIs.includes(provider)
    if (!isAllowed) return // bloqué par le plan
    const isSelected = selectedAIs.includes(provider)
    if (!isSelected && atMax) return // limite max atteinte
    onToggle(provider)
  }

  return (
    <div className="space-y-2">
      {/* Catégorie */}
      <div className="flex flex-wrap gap-1">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <button key={cat} onClick={() => onCategoryChange(cat)}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
              category === cat
                ? 'bg-[var(--sur2)] text-[var(--tx1)]'
                : 'text-[var(--mu3)] hover:text-[var(--mu1)] hover:bg-[var(--surface)]'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Sélection des IA */}
      <div className="flex flex-wrap gap-1">
        {AI_MODELS.map((ai) => {
          const isSelected  = selectedAIs.includes(ai.provider)
          const isAllowed   = !allowedAIs || allowedAIs.includes(ai.provider)
          const isDisabled  = !isAllowed || (!isSelected && atMax)

          return (
            <button
              key={ai.provider}
              onClick={() => handleToggle(ai.provider)}
              title={!isAllowed ? 'Disponible à partir du plan Starter' : atMax && !isSelected ? `Maximum ${maxAIs} IA simultanées` : undefined}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                isDisabled
                  ? 'border-transparent text-[var(--mu3)] opacity-40 cursor-not-allowed'
                  : isSelected
                    ? 'border-[var(--bdr)] bg-[var(--sur2)] text-[var(--tx1)]'
                    : 'border-transparent text-[var(--mu3)] hover:text-[var(--mu1)] hover:bg-[var(--surface)]'
              }`}
            >
              {!isAllowed
                ? <Lock size={9} className="shrink-0 text-[var(--mu3)]" />
                : <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? ai.color : '#3a3733' }} />
              }
              {ai.name}
            </button>
          )
        })}
      </div>

      {/* Avertissement max IA */}
      {atMax && maxAIs && (
        <p className="text-[10px] text-[var(--mu3)]">
          Maximum {maxAIs} IA simultanées sur votre plan. &nbsp;
          <Link href="/pricing" className="text-[#cf7d56] hover:underline">Upgrader →</Link>
        </p>
      )}

      {/* Avertissement IA verrouillées */}
      {allowedAIs && allowedAIs.length < AI_MODELS.length && (
        <p className="text-[10px] text-[var(--mu3)]">
          🔒 GPT-4o, Claude, Grok et Perplexity disponibles à partir du plan Starter. &nbsp;
          <Link href="/pricing" className="text-[#cf7d56] hover:underline">Voir les plans →</Link>
        </p>
      )}
    </div>
  )
}
