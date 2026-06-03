import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AI_MODELS, CATEGORY_LABELS, type Category } from '@/lib/types'
import { Users, MessageSquare, ThumbsUp, ThumbsDown, Crown, TrendingUp } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) {
    redirect('/chat')
  }

  const service = await createServiceClient()

  // Fetch all stats in parallel
  const [
    { count: totalUsers },
    { data: planBreakdown },
    { count: totalConversations },
    { count: totalMessages },
    { data: feedbackData },
    { data: usageData },
    { data: recentConvs },
  ] = await Promise.all([
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service.from('profiles').select('plan'),
    service.from('conversations').select('*', { count: 'exact', head: true }),
    service.from('messages').select('*', { count: 'exact', head: true }).eq('role', 'assistant'),
    service.from('feedbacks').select('provider, category, rating'),
    service.from('daily_usage').select('date, count').neq('date', 'lifetime').order('date', { ascending: false }).limit(14),
    service.from('conversations').select('id, title, created_at').order('created_at', { ascending: false }).limit(8),
  ])

  // Plan breakdown
  const plans = { free: 0, premium: 0, visitor: 0 }
  for (const p of planBreakdown ?? []) {
    if (p.plan in plans) plans[p.plan as keyof typeof plans]++
  }
  const premiumRevenue = plans.premium * 9.99

  // Feedback by provider
  const fbByProvider: Record<string, { up: number; down: number }> = {}
  const fbByCategory: Record<string, { up: number; down: number }> = {}
  for (const row of feedbackData ?? []) {
    if (!fbByProvider[row.provider]) fbByProvider[row.provider] = { up: 0, down: 0 }
    if (!fbByCategory[row.category]) fbByCategory[row.category] = { up: 0, down: 0 }
    if (row.rating === 1) { fbByProvider[row.provider].up++; fbByCategory[row.category].up++ }
    else { fbByProvider[row.provider].down++; fbByCategory[row.category].down++ }
  }

  // Usage: last 7 unique dates
  const usageDays = [...new Map((usageData ?? []).map((r) => [r.date, r])).values()]
    .slice(0, 7)
    .reverse()
  const maxUsage = Math.max(...usageDays.map((d) => d.count), 1)

  const totalFeedbacks = feedbackData?.length ?? 0

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard Admin</h1>
        <p className="text-sm text-[#a1a1aa]">Connecté en tant que {user.email}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Utilisateurs', value: totalUsers ?? 0, icon: <Users size={16} />, color: '#cf7d56' },
          { label: 'Premium', value: plans.premium, icon: <Crown size={16} />, color: '#f59e0b' },
          { label: 'Conversations', value: totalConversations ?? 0, icon: <MessageSquare size={16} />, color: '#10a37f' },
          { label: 'Réponses IA', value: totalMessages ?? 0, icon: <TrendingUp size={16} />, color: '#d4a853' },
          { label: 'Feedbacks', value: totalFeedbacks, icon: <ThumbsUp size={16} />, color: '#20b2aa' },
          {
            label: 'Revenus estimés',
            value: `${premiumRevenue.toFixed(2)} €`,
            icon: <Crown size={16} />,
            color: '#f59e0b',
          },
        ].map((card) => (
          <div key={card.label} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: card.color }}>{card.icon}</span>
              <span className="text-xs text-[#71717a]">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <section>
        <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Répartition des plans</h2>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
          {[
            { label: 'Premium', count: plans.premium, color: '#f59e0b' },
            { label: 'Gratuit (compte)', count: plans.free, color: '#cf7d56' },
          ].map(({ label, count, color }) => {
            const pct = totalUsers ? Math.round((count / totalUsers) * 100) : 0
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm w-32 text-[#a1a1aa]">{label}</span>
                <div className="flex-1 h-2 bg-[#27272a] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <span className="text-sm font-semibold tabular-nums w-10 text-right">{count}</span>
                <span className="text-xs text-[#52525b] w-8 text-right">{pct}%</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Usage last 7 days */}
      {usageDays.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Utilisation (7 derniers jours)</h2>
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
            <div className="flex items-end gap-2 h-24">
              {usageDays.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-[#cf7d56]/60 hover:bg-[#cf7d56] transition-colors"
                    style={{ height: `${Math.round((d.count / maxUsage) * 80)}px` }}
                    title={`${d.count} requêtes`}
                  />
                  <span className="text-[10px] text-[#52525b] truncate w-full text-center">
                    {d.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feedback by AI */}
      <section>
        <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Satisfaction par IA</h2>
        <div className="space-y-2">
          {AI_MODELS.map((model) => {
            const stats = fbByProvider[model.provider] ?? { up: 0, down: 0 }
            const tot = stats.up + stats.down
            const score = tot > 0 ? Math.round((stats.up / tot) * 100) : null
            return (
              <div key={model.provider} className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: model.color }} />
                <span className="text-sm font-medium flex-1">{model.name}</span>
                <span className="flex items-center gap-1 text-xs text-[#71717a]"><ThumbsUp size={11} className="text-emerald-400" />{stats.up}</span>
                <span className="flex items-center gap-1 text-xs text-[#71717a]"><ThumbsDown size={11} className="text-red-400" />{stats.down}</span>
                {score !== null ? (
                  <span className={`text-xs font-semibold w-10 text-right tabular-nums ${score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                    {score}%
                  </span>
                ) : (
                  <span className="text-xs text-[#52525b] w-10 text-right">—</span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Feedback by category */}
      {Object.keys(fbByCategory).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Satisfaction par domaine</h2>
          <div className="space-y-2">
            {Object.entries(fbByCategory).map(([cat, stats]) => {
              const tot = stats.up + stats.down
              const score = tot > 0 ? Math.round((stats.up / tot) * 100) : null
              return (
                <div key={cat} className="bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-sm flex-1">{CATEGORY_LABELS[cat as Category] ?? cat}</span>
                  <span className="flex items-center gap-1 text-xs text-[#71717a]"><ThumbsUp size={11} className="text-emerald-400" />{stats.up}</span>
                  <span className="flex items-center gap-1 text-xs text-[#71717a]"><ThumbsDown size={11} className="text-red-400" />{stats.down}</span>
                  {score !== null ? (
                    <span className={`text-xs font-semibold w-10 text-right tabular-nums ${score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {score}%
                    </span>
                  ) : <span className="text-xs text-[#52525b] w-10 text-right">—</span>}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent conversations */}
      {recentConvs && recentConvs.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">Conversations récentes</h2>
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl divide-y divide-[#27272a]">
            {recentConvs.map((conv) => (
              <div key={conv.id} className="px-4 py-3 flex items-center gap-3">
                <MessageSquare size={13} className="text-[#52525b] shrink-0" />
                <span className="text-sm flex-1 truncate">{conv.title}</span>
                <span className="text-xs text-[#52525b] shrink-0">
                  {new Date(conv.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
