import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

const schema = z.object({
  url: z.string().url(),
})

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12000)
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'URL invalide' }, { status: 400 })

  const { url } = parsed.data
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 })

  try {
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MetaAI/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!pageRes.ok) {
      return NextResponse.json({ error: `Impossible d'accéder à cette URL (${pageRes.status})` }, { status: 400 })
    }

    const html = await pageRes.text()
    const text = extractText(html)

    if (text.length < 100) {
      return NextResponse.json({ error: 'Contenu insuffisant pour résumer cette page.' }, { status: 400 })
    }

    const client = new OpenAI({ apiKey })
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en synthèse de contenu. Résume le texte fourni de manière claire et structurée en français.',
        },
        {
          role: 'user',
          content: `URL : ${url}\n\nContenu :\n${text}\n\nFais un résumé structuré avec :\n- Un titre court\n- Les points clés (3 à 7 points)\n- Une conclusion en 1 phrase`,
        },
      ],
      max_tokens: 1000,
    })

    return NextResponse.json({ summary: res.choices[0].message.content ?? '' })
  } catch (e: unknown) {
    const msg = (e as Error).message
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: 'La page met trop de temps à répondre.' }, { status: 408 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
