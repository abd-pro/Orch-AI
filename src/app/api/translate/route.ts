import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

const schema = z.object({
  text: z.string().min(1).max(10000),
  language: z.string().min(1).max(50),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { text, language } = parsed.data
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 })

  try {
    const client = new OpenAI({ apiKey })
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un traducteur expert. Traduis le texte fourni dans la langue demandée. Conserve le formatage markdown. Réponds uniquement avec la traduction, sans commentaire.',
        },
        {
          role: 'user',
          content: `Traduis en ${language} :\n\n${text}`,
        },
      ],
      max_tokens: 4000,
    })
    return NextResponse.json({ translation: res.choices[0].message.content ?? '' })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
