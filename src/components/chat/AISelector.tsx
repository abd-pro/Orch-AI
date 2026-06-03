'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lock, AlertTriangle, X } from 'lucide-react'
import { AI_MODELS, CATEGORY_LABELS, type AIProvider, type Category } from '@/lib/types'

const DEEPSEEK_OPT_IN_KEY = 'orch-deepseek-opt-in'

interface Props {
  selectedAIs: AIProvider[]
  onToggle: (provider: AIProvider) => void
  category: Category
  onCategoryChange: (category: Category) => void
  allowedAIs?: AIProvider[]
  maxAIs?: number
}

export default function AISelector({ selectedAIs, onToggle, category, onCategoryChange, allowedAIs, maxAIs }: Props) {
  const atMax = maxAIs !== undefined && selectedAIs.length >= maxAIs
  const [deepseekOptIn, setDeepseekOptIn] = useState(false)
  const [showDeepseekModal, setShowDeepseekModal] = useState(false)

  useEffect(() => {
    setDeepseekOptIn(localStorage.getItem(DEEPSEEK_OPT_IN_KEY) === 'true')
  }, [])

  function handleAcceptDeepseek() {
    localStorage.setItem(DEEPSEEK_OPT_IN_KEY, 'true')
    setDeepseekOptIn(true)
    setShowDeepseekModal(false)
    onToggle('deepseek')
  }

  function handleToggle(provider: AIProvider) {
    const isAllowed = !allowedAIs || allowedAIs.includes(provider)
    if (!isAllowed) return
    const isSelected = selectedAIs.includes(provider)
    if (!isSelected && atMax) return

    // DeepSeek nécessite un opt-in explicite
    if (provider === 'deepseek' && !isSelected && !deepseekOptIn) {
      setShowDeepseekModal(true)
      return
    }

    onToggle(provider)
  }

  return (
    <div className="space-y-2">

      {/* Modal opt-in DeepSeek */}
      {showDeepseekModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--sur2)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--fg)] mb-1">Avertissement — DeepSeek</h3>
                <p className="text-xs text-[var(--mu1)] leading-relaxed">
                  DeepSeek est un modèle d'IA développé par une entreprise <strong className="text-[var(--fg)]">basée en Chine</strong>.
                  Vos données et conversations peuvent être traitées sur des <strong className="text-[var(--fg)]">serveurs situés en Chine</strong>,
                  en dehors du cadre juridique européen (RGPD).
                </p>
              </div>
            </div>

            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 mb-5 text-xs text-[var(--mu1)] space-y-1">
              <p>⚠️ Ne partagez pas d'informations personnelles, professionnelles ou sensibles avec DeepSeek.</p>
              <p>⚠️ Les données peuvent être accessibles par des autorités chinoises.</p>
              <p>⚠️ Déconseillé pour un usage professionnel ou confidentiel.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDeepseekModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--sur2)] text-sm text-[var(--mu1)] hover:text-[var(--fg)] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAcceptDeepseek}
                className="flex-1 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-sm text-amber-400 hover:bg-amber-500/30 transition-colors font-medium"
              >
                J'accepte les risques
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catégories */}
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
          const isSelected   = selectedAIs.includes(ai.provider)
          const isAllowed    = !allowedAIs || allowedAIs.includes(ai.provider)
          const needsOptIn   = ai.provider === 'deepseek' && !deepseekOptIn && !isSelected
          const isDisabled   = !isAllowed || (!isSelected && atMax)

          return (
            <button
              key={ai.provider}
              onClick={() => handleToggle(ai.provider)}
              title={
                !isAllowed    ? 'Disponible à partir du plan Starter' :
                needsOptIn    ? 'Cliquez pour voir les conditions d\'utilisation' :
                atMax && !isSelected ? `Maximum ${maxAIs} IA simultanées` :
                undefined
              }
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors ${
                isDisabled
                  ? 'border-transparent text-[var(--mu3)] opacity-40 cursor-not-allowed'
                  : needsOptIn
                    ? 'border-amber-500/30 text-amber-400/70 hover:border-amber-500/60 hover:text-amber-400 cursor-pointer'
                    : isSelected
                      ? 'border-[var(--bdr)] bg-[var(--sur2)] text-[var(--tx1)]'
                      : 'border-transparent text-[var(--mu3)] hover:text-[var(--mu1)] hover:bg-[var(--surface)]'
              }`}
            >
              {!isAllowed
                ? <Lock size={9} className="shrink-0 text-[var(--mu3)]" />
                : needsOptIn
                  ? <AlertTriangle size={9} className="shrink-0 text-amber-400" />
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
