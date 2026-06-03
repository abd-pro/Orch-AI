import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  const { question, response } = await request.json()

  if (!question || !response) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant qui génère des questions de suivi pertinentes. Réponds UNIQUEMENT avec un tableau JSON de 3 courtes questions (max 10 mots chacune), sans aucun autre texte. Exemple: ["Question 1?", "Question 2?", "Question 3?"]',
        },
        {
          role: 'user',
          content: `Question posée: "${question}"\n\nRéponse donnée: "${response.slice(0, 500)}"\n\nGénère 3 questions de suivi pertinentes et concises.`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    const raw = completion.choices[0]?.message?.content ?? '[]'
    const suggestions = JSON.parse(raw)
    if (!Array.isArray(suggestions)) return NextResponse.json({ suggestions: [] })
    return NextResponse.json({ suggestions: suggestions.slice(0, 3) })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
