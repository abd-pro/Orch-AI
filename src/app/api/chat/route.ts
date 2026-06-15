import { createClient, createServiceClient } from '@/lib/supabase/server'
import { streamOrchestrate, type ImageAttachment } from '@/lib/ai/orchestrator'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { PLANS, type UserPlan, type AIProvider } from '@/lib/types'

// Repli quand l'IA de titrage échoue : tronque proprement la question en une
// phrase lisible (jamais une liste de mots-clés type "Mot, Mot, Mot").
function truncateQuestion(text: string, maxLen = 42): string {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (!clean) return 'Nouvelle conversation'
  if (clean.length <= maxLen) return clean.charAt(0).toUpperCase() + clean.slice(1)
  const cut = clean.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  const base = (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trim()
  return base.charAt(0).toUpperCase() + base.slice(1) + '…'
}

const chatSchema = z.object({
  question: z.string().min(1).max(4000),
  selectedAIs: z.array(z.enum(['openai', 'anthropic', 'gemini', 'mistral', 'perplexity', 'grok', 'deepseek', 'groq'])).min(1),
  conversationId: z.string().uuid().optional(),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
  customPrompt: z.string().max(2000).optional(),
  fileContent: z.string().max(50000).optional(),
  fileName: z.string().max(255).optional(),
  fileBase64: z.string().optional(),
  fileMimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']).optional(),
})

async function generateTitle(question: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return truncateQuestion(question)
  try {
    const OpenAI = (await import('openai')).default
    const client = new OpenAI({ apiKey })
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 20,
      messages: [
        { role: 'system', content: 'Tu génères un titre court et naturel (2 à 5 mots) résumant le sujet d\'une question, comme un titre de conversation. En français, sans guillemets ni ponctuation finale, première lettre en majuscule. Exemples : "Autonomie de la batterie", "Tour Eiffel", "Meilleur joueur de foot".' },
        { role: 'user', content: question.slice(0, 500) },
      ],
    })
    const title = res.choices[0]?.message?.content?.trim().replace(/^["'«»\s]+|["'«».\s]+$/g, '')
    return title && title.length > 0 ? title : truncateQuestion(question)
  } catch {
    return truncateQuestion(question)
  }
}

async function getAnonymousIdentifier(): Promise<string> {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? headersList.get('x-real-ip') ?? 'unknown'
  return `anon:${ip}`
}

async function getUserPlan(userId: string | null, userEmail?: string): Promise<UserPlan> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && userEmail === adminEmail) return 'dev'
  if (!userId) return 'visitor'
  const serviceClient = await createServiceClient()
  const { data: profile } = await serviceClient.from('profiles').select('plan').eq('id', userId).single()
  const plan = profile?.plan as UserPlan | undefined
  if (plan && plan in PLANS) return plan
  return 'free'
}

async function checkUsage(
  userId: string | null,
  identifier: string,
  userEmail: string | undefined,
  selectedAIs: AIProvider[],
): Promise<{ allowed: boolean; remaining: number; plan: UserPlan; error?: string }> {
  const plan = await getUserPlan(userId, userEmail)
  const config = PLANS[plan]

  // Plan illimité
  if (config.credits === Infinity) return { allowed: true, remaining: Infinity, plan }

  // Vérif nb IA max
  if (selectedAIs.length > config.maxAIs) {
    return { allowed: false, remaining: 0, plan, error: `Votre plan ${config.label} est limité à ${config.maxAIs} IA simultanées.` }
  }

  // Vérif IA autorisées
  const forbidden = selectedAIs.filter((ai) => !config.allowedAIs.includes(ai))
  if (forbidden.length > 0) {
    return { allowed: false, remaining: 0, plan, error: `Les IA suivantes ne sont pas disponibles dans votre plan : ${forbidden.join(', ')}.` }
  }

  const serviceClient = await createServiceClient()
  const dateKey = plan === 'visitor' ? 'lifetime' : new Date().toISOString().slice(0, 7)
  const { data } = await serviceClient.from('daily_usage').select('count').eq('identifier', identifier).eq('date', dateKey).single()
  const used = data?.count ?? 0
  const cost = selectedAIs.length // 1 crédit par IA

  if (used + cost > config.credits) {
    return { allowed: false, remaining: Math.max(0, config.credits - used), plan }
  }

  await serviceClient.from('daily_usage').upsert(
    { identifier, date: dateKey, count: used + cost },
    { onConflict: 'identifier,date' }
  )
  return { allowed: true, remaining: config.credits - used - cost, plan }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  // Le web s'authentifie via cookies (SSR) ; l'app mobile via un header Bearer.
  // On gère les deux pour que l'identité (et donc le plan) soit correcte sur mobile.
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const { data: { user } } = bearer
    ? await supabase.auth.getUser(bearer)
    : await supabase.auth.getUser()

  const body = await request.json()
  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { question, selectedAIs, conversationId, history, customPrompt, fileContent, fileBase64, fileMimeType } = parsed.data
  const image: ImageAttachment | undefined =
    fileBase64 && fileMimeType ? { base64: fileBase64, mimeType: fileMimeType } : undefined
  const identifier = user ? user.id : await getAnonymousIdentifier()
  const usage = await checkUsage(user?.id ?? null, identifier, user?.email ?? undefined, selectedAIs)

  if (!usage.allowed) {
    const message = usage.error ?? (
      usage.plan === 'visitor'
        ? 'Vous avez utilisé vos 3 questions gratuites. Créez un compte pour continuer.'
        : `Crédits insuffisants (${usage.remaining} restants). Passez au plan supérieur pour continuer.`
    )
    return NextResponse.json({ error: message, limitReached: true, plan: usage.plan }, { status: 429 })
  }

  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  async function send(data: Record<string, unknown>) {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  ;(async () => {
    try {
      // Titre IA généré en parallèle du streaming (qui dure plusieurs secondes),
      // pour qu'il soit prêt à l'insertion — sans fire-and-forget tué par Vercel.
      const titlePromise = user && !conversationId ? generateTitle(question) : null
      let finalAiResponses: import('@/lib/types').AIResponse[] = []
      let finalArbitratorAI: AIProvider | null = null
      let finalSourceAI: AIProvider | null = null
      let finalBestResponse = ''
      let finalSources: { title: string; url: string }[] = []
      let finalDivergence: string = 'faible'
      let finalDivergenceReason: string = ''

      for await (const event of streamOrchestrate(question, selectedAIs as AIProvider[], history ?? [], customPrompt, fileContent, image)) {
        if (event.type === 'ai_result') {
          await send({
            type: 'ai_result',
            provider: event.response.provider,
            hasError: !!event.response.error,
            content: event.response.content ?? '',
            durationMs: event.response.durationMs,
          })
        } else if (event.type === 'token') {
          await send({ type: 'token', text: event.text })
        } else if (event.type === 'complete') {
          finalSources = event.sources
          finalAiResponses = event.aiResponses
          finalArbitratorAI = event.arbitratorAI
          finalSourceAI = event.sourceAI
          finalBestResponse = event.bestResponse
          finalDivergence = event.divergence
          finalDivergenceReason = event.divergenceReason
        }
      }

      // Sauvegarder en base si utilisateur connecté
      let convId = conversationId
      if (user) {
        const serviceClient = await createServiceClient()
        if (!convId) {
          const title = titlePromise ? await titlePromise : truncateQuestion(question)
          const { data: newConv } = await serviceClient
            .from('conversations')
            .insert({ user_id: user.id, title })
            .select('id')
            .single()
          convId = newConv?.id
        }
        if (convId) {
          await serviceClient.from('messages').insert([
            { conversation_id: convId, role: 'user', content: question },
            {
              conversation_id: convId,
              role: 'assistant',
              content: finalBestResponse,
              ai_responses: finalAiResponses,
              selected_ais: selectedAIs,
              arbitrator_ai: finalArbitratorAI,
            },
          ])
        }
      }

      await send({
        type: 'done',
        conversationId: convId,
        remaining: usage.remaining,
        plan: usage.plan,
        aiResponses: finalAiResponses,
        arbitratorAI: finalArbitratorAI,
        sourceAI: finalSourceAI,
        sources: finalSources,
        divergence: finalDivergence,
        divergenceReason: finalDivergenceReason,
      })
    } catch (e) {
      await send({ type: 'error', message: (e as Error).message })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
