import { NextResponse } from 'next/server'
import { streamDebate } from '@/lib/ai/orchestrator'
import { z } from 'zod'
import type { AIProvider } from '@/lib/types'

const schema = z.object({
  question: z.string().min(1).max(4000),
  selectedAIs: z.array(z.enum(['openai', 'anthropic', 'gemini', 'mistral', 'perplexity', 'grok', 'deepseek'])).min(2),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { question, selectedAIs } = parsed.data

  try {
    for await (const event of streamDebate(question, selectedAIs as AIProvider[])) {
      if (event.type === 'debate_complete') {
        return NextResponse.json({ debate: event.debate, verdict: event.verdict })
      }
    }
    return NextResponse.json({ debate: [], verdict: undefined })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
