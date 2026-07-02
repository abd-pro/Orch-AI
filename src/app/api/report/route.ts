import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const reportSchema = z.object({
  content: z.string().max(5000).optional(),
  provider: z.string().max(40).optional(),
  reason: z.string().max(500).default('non spécifié'),
})

// Signalement de contenu — modération (exigence App Store / Google Play pour le contenu généré par IA).
// Requiert la table `reports` (voir supabase-migration-reports.sql).
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parsed = reportSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const supabase = await createClient()
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const { data: { user } } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser()

  const admin = await createServiceClient()
  const { error } = await admin.from('reports').insert({
    user_id: user?.id ?? null,
    reported_content: parsed.data.content ?? null,
    provider: parsed.data.provider ?? null,
    reason: parsed.data.reason,
  })
  // Best-effort : si la table n'existe pas encore, on log au lieu de faire échouer le signalement
  if (error) console.error('[report] insert error (table `reports` créée ?):', error.message)

  return NextResponse.json({ success: true })
}
