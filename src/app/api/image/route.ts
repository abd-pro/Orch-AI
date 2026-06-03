import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import type { ImageProvider } from '@/lib/types'

const schema = z.object({
  prompt: z.string().min(1).max(1000),
  providers: z.array(z.enum(['dalle', 'stability', 'flux', 'ideogram', 'gptimage'])).min(1),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).default('1:1'),
})

// ── Pollinations AI (gratuit, sans clé) ───────────────────────────────────────
async function generateDalle(prompt: string, aspectRatio: string) {
  const start = Date.now()
  const sizeMap: Record<string, { width: number; height: number }> = {
    '1:1':  { width: 1024, height: 1024 },
    '16:9': { width: 1344, height: 768 },
    '9:16': { width: 768,  height: 1344 },
  }
  const { width, height } = sizeMap[aspectRatio] ?? { width: 1024, height: 1024 }
  try {
    const encoded = encodeURIComponent(prompt)
    const seed = Math.floor(Math.random() * 999999)
    const historyUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`
    const res = await fetch(historyUrl)
    if (!res.ok) return { error: `Erreur Pollinations (${res.status})`, durationMs: Date.now() - start }
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mime = res.headers.get('content-type') ?? 'image/jpeg'
    return { url: `data:${mime};base64,${base64}`, historyUrl, durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { error: (e as Error).message, durationMs: Date.now() - start }
  }
}

// ── Stability AI SD3 ──────────────────────────────────────────────────────────
async function generateStability(prompt: string, aspectRatio: string) {
  const start = Date.now()
  const apiKey = process.env.STABILITY_API_KEY
  if (!apiKey) return { error: 'Clé API manquante', durationMs: 0 }
  try {
    const form = new FormData()
    form.append('prompt', prompt)
    form.append('output_format', 'webp')
    form.append('aspect_ratio', aspectRatio)
    const res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { error: err.errors?.[0] ?? `Erreur Stability (${res.status})`, durationMs: Date.now() - start }
    }
    const data = await res.json()
    return { url: `data:image/webp;base64,${data.image}`, durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { error: (e as Error).message, durationMs: Date.now() - start }
  }
}

// ── Flux 1.1 Pro (fal.ai) ────────────────────────────────────────────────────
async function generateFlux(prompt: string, aspectRatio: string) {
  const start = Date.now()
  const apiKey = process.env.FAL_API_KEY
  if (!apiKey) return { error: 'Clé API manquante', durationMs: 0 }
  const sizeMap: Record<string, string> = {
    '1:1': 'square_hd', '16:9': 'landscape_16_9', '9:16': 'portrait_16_9',
  }
  try {
    const res = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
      method: 'POST',
      headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, image_size: sizeMap[aspectRatio] ?? 'square_hd', num_images: 1 }),
    })
    if (!res.ok) return { error: `Erreur Flux (${res.status})`, durationMs: Date.now() - start }
    const data = await res.json()
    const url = data.images?.[0]?.url
    return { url, error: url ? undefined : 'Pas d\'image générée', durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { error: (e as Error).message, durationMs: Date.now() - start }
  }
}

// ── Ideogram 2 ────────────────────────────────────────────────────────────────
async function generateIdeogram(prompt: string, aspectRatio: string) {
  const start = Date.now()
  const apiKey = process.env.IDEOGRAM_API_KEY
  if (!apiKey) return { error: 'Clé API manquante', durationMs: 0 }
  const arMap: Record<string, string> = {
    '1:1': 'ASPECT_1_1', '16:9': 'ASPECT_16_9', '9:16': 'ASPECT_9_16',
  }
  try {
    const res = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_request: { prompt, aspect_ratio: arMap[aspectRatio] ?? 'ASPECT_1_1', model: 'V_2', magic_prompt_option: 'AUTO' } }),
    })
    if (!res.ok) return { error: `Erreur Ideogram (${res.status})`, durationMs: Date.now() - start }
    const data = await res.json()
    const url = data.data?.[0]?.url
    return { url, error: url ? undefined : 'Pas d\'image', durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { error: (e as Error).message, durationMs: Date.now() - start }
  }
}

// ── ChatGPT Image (gpt-image-1) ───────────────────────────────────────────────
async function generateChatGPTImage(prompt: string, aspectRatio: string) {
  const start = Date.now()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { error: 'Clé API manquante', durationMs: 0 }
  try {
    const client = new OpenAI({ apiKey })
    const sizeMap: Record<string, '1024x1024' | '1536x1024' | '1024x1536'> = {
      '1:1': '1024x1024', '16:9': '1536x1024', '9:16': '1024x1536',
    }
    const res = await client.images.generate({
      model: 'gpt-image-1', prompt, n: 1,
      size: sizeMap[aspectRatio] ?? '1024x1024',
    })
    const item = res.data[0]
    const url = item.url ?? (item.b64_json ? `data:image/png;base64,${item.b64_json}` : undefined)
    return { url, error: url ? undefined : 'Pas d\'image', durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { error: (e as Error).message, durationMs: Date.now() - start }
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { prompt, providers, aspectRatio } = parsed.data

  const results = await Promise.all(
    providers.map(async (provider: ImageProvider) => {
      switch (provider) {
        case 'dalle':     return { provider, ...(await generateDalle(prompt, aspectRatio)) }
        case 'stability': return { provider, ...(await generateStability(prompt, aspectRatio)) }
        case 'flux':      return { provider, ...(await generateFlux(prompt, aspectRatio)) }
        case 'ideogram':  return { provider, ...(await generateIdeogram(prompt, aspectRatio)) }
        case 'gptimage':  return { provider, ...(await generateChatGPTImage(prompt, aspectRatio)) }
      }
    })
  )

  return NextResponse.json({ results })
}
