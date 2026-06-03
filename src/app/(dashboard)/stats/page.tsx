import { createServiceClient } from '@/lib/supabase/server'
import { AI_MODELS, CATEGORY_LABELS, type Category } from '@/lib/types'
import { BarChart2, ThumbsUp, ThumbsDown } from 'lucide-react'

export default async function StatsPage() {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('feedbacks')
    .select('provider, category, rating')

  const byProvider: Record<string, { up: number; down: number }> = {}
  const byCategory: Record<string, { up: number; down: number }> = {}

  for (const row of data ?? []) {
    if (!byProvider[row.provider]) byProvider[row.provider] = { up: 0, down: 0 }
    if (!byCategory[row.category]) byCategory[row.category] = { up: 0, down: 0 }

    if (row.rating === 1) {
      byProvider[row.provider].up++
      byCategory[row.category].up++
    } else {
      byProvider[row.provider].down++
      byCategory[row.category].down++
    }
  }

  const total = data?.length ?? 0

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Statistiques</h1>
        <p className="text-sm text-[#a1a1aa]">
          {total} retour{total > 1 ? 's' : ''} utilisateur{total > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Stats par IA */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart2 size={14} className="text-[#cf7d56]" />
          Par IA
        </h2>
        <div className="space-y-2">
          {AI_MODELS.map((model) => {
            const stats = byProvider[model.provider] ?? { up: 0, down: 0 }
            const tot = stats.up + stats.down
            const score = tot > 0 ? Math.round((stats.up / tot) * 100) : null

            return (
              <div key={model.provider} className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: model.color }} />
                  <span className="text-sm font-medium flex-1">{model.name}</span>
                  <span className="text-xs text-[#52525b]">{tot} avis</span>
                  {score !== null && (
                    <span className={`text-xs font-semibold tabular-nums ${
                      score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {score}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-xs text-[#71717a]">
                    <ThumbsUp size={11} className="text-emerald-400" />
                    {stats.up}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#71717a]">
                    <ThumbsDown size={11} className="text-red-400" />
                    {stats.down}
                  </span>
                  {tot > 0 && (
                    <div className="flex-1 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats par domaine */}
      <section>
        <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3 flex items-center gap-2">
          <BarChart2 size={14} className="text-[#cf7d56]" />
          Par domaine
        </h2>
        <div className="space-y-2">
          {Object.entries(byCategory).length === 0 ? (
            <p className="text-sm text-[#52525b] text-center py-10">Aucun retour par domaine pour l&apos;instant.</p>
          ) : (
            Object.entries(byCategory).map(([cat, stats]) => {
              const tot = stats.up + stats.down
              const score = tot > 0 ? Math.round((stats.up / tot) * 100) : null
              const label = CATEGORY_LABELS[cat as Category] ?? cat

              return (
                <div key={cat} className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium flex-1">{label}</span>
                    <span className="text-xs text-[#52525b]">{tot} avis</span>
                    {score !== null && (
                      <span className={`text-xs font-semibold tabular-nums ${
                        score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {score}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs text-[#71717a]">
                      <ThumbsUp size={11} className="text-emerald-400" />
                      {stats.up}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#71717a]">
                      <ThumbsDown size={11} className="text-red-400" />
                      {stats.down}
                    </span>
                    {tot > 0 && (
                      <div className="flex-1 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
