import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'

const feedbackSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini', 'mistral', 'perplexity']),
  rating: z.union([z.literal(1), z.literal(-1)]),
  category: z.string().default('general'),
  isFinalResponse: z.boolean().default(false),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = feedbackSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { provider, rating, category, isFinalResponse } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const sessionId = `anon:${ip}`

  const serviceClient = await createServiceClient()
  await serviceClient.from('feedbacks').insert({
    user_id: user?.id ?? null,
    session_id: user ? null : sessionId,
    provider,
    category,
    rating,
    is_final_response: isFinalResponse,
  })

  return NextResponse.json({ success: true })
}
