import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Suppression de compte — RGPD (droit à l'effacement) + exigence App Store / Google Play.
// Le mobile envoie un Bearer token ; le web utilise les cookies SSR.
export async function POST(request: Request) {
  const supabase = await createClient()
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const { data: { user } } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = await createServiceClient()

  // Données sans clé étrangère en cascade → suppression manuelle
  await admin.from('daily_usage').delete().eq('identifier', user.id)
  await admin.from('feedbacks').delete().eq('user_id', user.id)

  // Supprime l'utilisateur auth → CASCADE automatique : profiles, api_keys, conversations → messages
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[account/delete] deleteUser error:', error.message)
    return NextResponse.json({ error: 'Échec de la suppression du compte' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
