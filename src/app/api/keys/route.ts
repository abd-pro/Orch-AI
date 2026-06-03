import { createClient, createServiceClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/encryption'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const saveKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini', 'mistral', 'perplexity']),
  key: z.string().min(10),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data } = await supabase
    .from('api_keys')
    .select('provider, encrypted_key')
    .eq('user_id', user.id)

  // On retourne uniquement les providers connectés (sans les clés)
  const connected = (data ?? []).map((row) => row.provider)
  return NextResponse.json({ connected })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const parsed = saveKeySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { provider, key } = parsed.data
  const encryptedKey = encrypt(key)

  const serviceClient = await createServiceClient()
  const { error } = await serviceClient
    .from('api_keys')
    .upsert({ user_id: user.id, provider, encrypted_key: encryptedKey, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')
  if (!provider) return NextResponse.json({ error: 'Provider manquant' }, { status: 400 })

  const serviceClient = await createServiceClient()
  await serviceClient.from('api_keys').delete().eq('user_id', user.id).eq('provider', provider)

  return NextResponse.json({ success: true })
}

// Fonction interne pour récupérer une clé déchiffrée (utilisée par l'orchestrateur)
export async function getDecryptedKey(userId: string, provider: string): Promise<string | null> {
  const { createClient: createSC } = await import('@/lib/supabase/server')
  const supabase = await createSC()
  const { data } = await supabase
    .from('api_keys')
    .select('encrypted_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single()

  if (!data) return null
  try {
    return decrypt(data.encrypted_key)
  } catch {
    return null
  }
}
