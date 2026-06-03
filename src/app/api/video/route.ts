import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  prompt: z.string().min(1).max(1000),
  provider: z.enum(['runway', 'luma', 'kling', 'pika', 'minimax']),
  duration: z.enum(['5', '10']).default('5'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ── Runway Gen-3 ──────────────────────────────────────────────────────────────
async function generateRunway(prompt: string, duration: string, aspectRatio: string, onStatus: (s: string) => void) {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) return { error: 'Clé API manquante' }
  const ratioMap: Record<string, string> = { '16:9': '1280:720', '9:16': '720:1280', '1:1': '960:960' }
  try {
    onStatus('Création de la tâche…')
    const res = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' },
      body: JSON.stringify({ promptText: prompt, model: 'gen3a_turbo', duration: parseInt(duration), ratio: ratioMap[aspectRatio] ?? '1280:720' }),
    })
    if (!res.ok) return { error: `Erreur Runway (${res.status})` }
    const { id } = await res.json()
    onStatus('Génération en cours…')
    for (let i = 0; i < 60; i++) {
      await sleep(5000)
      const poll = await fetch(`https://api.dev.runwayml.com/v1/tasks/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' },
      })
      const task = await poll.json()
      if (task.status === 'SUCCEEDED') return { url: task.output?.[0] }
      if (task.status === 'FAILED') return { error: task.failure ?? 'Génération échouée' }
      onStatus(`En cours… (${Math.round((i + 1) * 5)}s)`)
    }
    return { error: 'Timeout — réessayez' }
  } catch (e: unknown) { return { error: (e as Error).message } }
}

// ── Luma Dream Machine ────────────────────────────────────────────────────────
async function generateLuma(prompt: string, aspectRatio: string, onStatus: (s: string) => void) {
  const apiKey = process.env.LUMA_API_KEY
  if (!apiKey) return { error: 'Clé API manquante' }
  const arMap: Record<string, string> = { '16:9': '16:9', '9:16': '9:16', '1:1': '1:1' }
  try {
    onStatus('Création de la génération…')
    const res = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspect_ratio: arMap[aspectRatio] ?? '16:9', loop: false }),
    })
    if (!res.ok) return { error: `Erreur Luma (${res.status})` }
    const { id } = await res.json()
    onStatus('Génération en cours…')
    for (let i = 0; i < 60; i++) {
      await sleep(5000)
      const poll = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const gen = await poll.json()
      if (gen.state === 'completed') return { url: gen.assets?.video }
      if (gen.state === 'failed') return { error: gen.failure_reason ?? 'Génération échouée' }
      onStatus(`En cours… (${Math.round((i + 1) * 5)}s)`)
    }
    return { error: 'Timeout — réessayez' }
  } catch (e: unknown) { return { error: (e as Error).message } }
}

// ── Kling 1.6 ────────────────────────────────────────────────────────────────
async function generateKling(prompt: string, duration: string, aspectRatio: string, onStatus: (s: string) => void) {
  const apiKey = process.env.KLING_API_KEY
  if (!apiKey) return { error: 'Clé API manquante' }
  const arMap: Record<string, string> = { '16:9': '16:9', '9:16': '9:16', '1:1': '1:1' }
  try {
    onStatus('Création de la tâche…')
    const res = await fetch('https://api.klingai.com/v1/videos/text2video', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model_name: 'kling-v1-6', duration: duration, aspect_ratio: arMap[aspectRatio] ?? '16:9', mode: 'std' }),
    })
    if (!res.ok) return { error: `Erreur Kling (${res.status})` }
    const data = await res.json()
    const taskId = data.data?.task_id
    if (!taskId) return { error: 'Pas d\'ID de tâche' }
    onStatus('Génération en cours…')
    for (let i = 0; i < 60; i++) {
      await sleep(5000)
      const poll = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const task = await poll.json()
      const status = task.data?.task_status
      if (status === 'succeed') return { url: task.data?.task_result?.videos?.[0]?.url }
      if (status === 'failed') return { error: task.data?.task_status_msg ?? 'Génération échouée' }
      onStatus(`En cours… (${Math.round((i + 1) * 5)}s)`)
    }
    return { error: 'Timeout — réessayez' }
  } catch (e: unknown) { return { error: (e as Error).message } }
}

// ── Pika 2.0 ─────────────────────────────────────────────────────────────────
async function generatePika(prompt: string, aspectRatio: string, onStatus: (s: string) => void) {
  const apiKey = process.env.PIKA_API_KEY
  if (!apiKey) return { error: 'Clé API manquante' }
  const arMap: Record<string, string> = { '16:9': '16:9', '9:16': '9:16', '1:1': '1:1' }
  try {
    onStatus('Création de la génération…')
    const res = await fetch('https://api.pika.art/v1/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, options: { aspectRatio: arMap[aspectRatio] ?? '16:9', frameRate: 24, duration: 5 } }),
    })
    if (!res.ok) return { error: `Erreur Pika (${res.status})` }
    const data = await res.json()
    const jobId = data.data?.id ?? data.job_id
    if (!jobId) return { error: 'Pas d\'ID de tâche' }
    onStatus('Génération en cours…')
    for (let i = 0; i < 60; i++) {
      await sleep(5000)
      const poll = await fetch(`https://api.pika.art/v1/generate/${jobId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const job = await poll.json()
      const status = job.data?.status ?? job.status
      if (status === 'finished' || status === 'completed') return { url: job.data?.video?.url ?? job.video_url }
      if (status === 'failed' || status === 'error') return { error: job.data?.error ?? 'Génération échouée' }
      onStatus(`En cours… (${Math.round((i + 1) * 5)}s)`)
    }
    return { error: 'Timeout — réessayez' }
  } catch (e: unknown) { return { error: (e as Error).message } }
}

// ── MiniMax / Hailuo ─────────────────────────────────────────────────────────
async function generateMinimax(prompt: string, onStatus: (s: string) => void) {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) return { error: 'Clé API manquante' }
  try {
    onStatus('Création de la tâche…')
    const res = await fetch('https://api.minimax.io/v1/video_generation', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: 'video-01' }),
    })
    if (!res.ok) return { error: `Erreur MiniMax (${res.status})` }
    const { task_id } = await res.json()
    if (!task_id) return { error: 'Pas d\'ID de tâche' }
    onStatus('Génération en cours…')
    for (let i = 0; i < 60; i++) {
      await sleep(5000)
      const poll = await fetch(`https://api.minimax.io/v1/query/video_generation?task_id=${task_id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const task = await poll.json()
      if (task.status === 'Success') return { url: task.file_id ? `https://api.minimax.io/v1/files/retrieve?GroupId=${task.base_resp?.group_id}&file_id=${task.file_id}` : undefined }
      if (task.status === 'Fail') return { error: 'Génération échouée' }
      onStatus(`En cours… (${Math.round((i + 1) * 5)}s)`)
    }
    return { error: 'Timeout — réessayez' }
  } catch (e: unknown) { return { error: (e as Error).message } }
}

// ── SSE Route ─────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { prompt, provider, duration, aspectRatio } = parsed.data
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  const send = async (data: Record<string, unknown>) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  ;(async () => {
    const start = Date.now()
    const onStatus = (message: string) => send({ type: 'status', message })

    let result: { url?: string; error?: string }

    switch (provider) {
      case 'runway':  result = await generateRunway(prompt, duration, aspectRatio, onStatus); break
      case 'luma':    result = await generateLuma(prompt, aspectRatio, onStatus); break
      case 'kling':   result = await generateKling(prompt, duration, aspectRatio, onStatus); break
      case 'pika':    result = await generatePika(prompt, aspectRatio, onStatus); break
      case 'minimax': result = await generateMinimax(prompt, onStatus); break
    }

    await send({ type: 'done', ...result, durationMs: Date.now() - start })
    await writer.close()
  })()

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}
