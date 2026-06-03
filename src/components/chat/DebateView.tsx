'use client'

import { AI_MODELS } from '@/lib/types'
import type { DebateResponse } from '@/lib/ai/orchestrator'
import MarkdownMessage from './MarkdownMessage'

interface Props {
  debate: DebateResponse[]
  verdict?: string
  question: string
}

export default function DebateView({ debate, verdict, question }: Props) {
  const pour = debate.find((d) => d.role === 'pour')
  const contre = debate.find((d) => d.role === 'contre')

  if (!pour || !contre) return null

  const modelPour = AI_MODELS.find((m) => m.provider === pour.provider)
  const modelContre = AI_MODELS.find((m) => m.provider === contre.provider)

  return (
    <div className="space-y-4 w-full">
      {/* En-tête débat */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--sur2)]" />
        <span className="text-xs text-[var(--mu3)] font-medium px-2">⚔️ Mode Débat — {question.slice(0, 60)}{question.length > 60 ? '…' : ''}</span>
        <div className="h-px flex-1 bg-[var(--sur2)]" />
      </div>

      {/* Colonnes PRO / CONTRE */}
      <div className="grid grid-cols-2 gap-3">
        {/* POUR */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-base">✅</span>
            <div>
              <p className="text-xs font-semibold text-emerald-400">POUR</p>
              <p className="text-xs text-[var(--mu3)]">{modelPour?.name}</p>
            </div>
            {pour.durationMs && <span className="ml-auto text-xs text-[var(--mu3)]">{(pour.durationMs / 1000).toFixed(1)}s</span>}
          </div>
          <div className="bg-[var(--surface)] border border-emerald-500/10 rounded-xl px-4 py-3 text-sm leading-relaxed overflow-y-auto max-h-80">
            <MarkdownMessage content={pour.content} />
          </div>
        </div>

        {/* CONTRE */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="text-base">❌</span>
            <div>
              <p className="text-xs font-semibold text-red-400">CONTRE</p>
              <p className="text-xs text-[var(--mu3)]">{modelContre?.name}</p>
            </div>
            {contre.durationMs && <span className="ml-auto text-xs text-[var(--mu3)]">{(contre.durationMs / 1000).toFixed(1)}s</span>}
          </div>
          <div className="bg-[var(--surface)] border border-red-500/10 rounded-xl px-4 py-3 text-sm leading-relaxed overflow-y-auto max-h-80">
            <MarkdownMessage content={contre.content} />
          </div>
        </div>
      </div>

      {/* Verdict */}
      {verdict && (
        <div className="bg-[var(--surface)] border border-[#cf7d56]/20 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-[#e8a07a] mb-2">⚖️ Verdict de l'arbitre</p>
          <div className="text-sm text-[var(--mu1)] leading-relaxed">
            <MarkdownMessage content={verdict} />
          </div>
        </div>
      )}
    </div>
  )
}
