import { NextResponse } from 'next/server'
import { extractText } from 'unpdf'

export async function POST(request: Request) {
  const { fileBase64 } = await request.json()

  if (!fileBase64) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(fileBase64, 'base64')
    const uint8Array = new Uint8Array(buffer)

    const { text, totalPages } = await extractText(uint8Array, { mergePages: true })

    const result = (Array.isArray(text) ? text.join('\n') : text).trim().slice(0, 30_000)

    return NextResponse.json({ text: result, pages: totalPages })
  } catch (err) {
    console.error('[extract-pdf]', err)
    return NextResponse.json(
      { error: 'Impossible de lire ce PDF. Vérifiez que le fichier n\'est pas protégé.' },
      { status: 422 }
    )
  }
}
