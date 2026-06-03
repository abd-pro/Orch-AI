'use client'

import { useState } from 'react'
import { Send, Download, AlertCircle, Loader2 } from 'lucide-react'
import { VIDEO_MODELS, type VideoProvider } from '@/lib/types'

const DURATIONS = [{ value: '5', label: '5s' }, { value: '10', label: '10s' }]
const ASPECT_RATIOS = [{ value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' }, { value: '1:1', label: '1:1' }]

export default function VideoPage() {
  const [prompt, setPrompt] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<VideoProvider>('runway')
  const [duration, setDuration] = useState('5')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [status, setStatus] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [durationMs, setDurationMs] = useState<number | null>(null)

  async function handleGenerate() {
    if (!prompt.trim() || loading) return
    setError('')
    setVideoUrl(null)
    setStatus('')
    setDurationMs(null)
    setLoading(true)

    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), provider: selectedProvider, duration, aspectRatio }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Erreur de connexion')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          try {
            const event = JSON.parse(part.slice(6))
            if (event.type === 'status') setStatus(event.message)
            else if (event.type === 'done') {
              if (event.error) setError(event.error)
              else { setVideoUrl(event.url); setDurationMs(event.durationMs) }
              setStatus('')
            }
          } catch {}
        }
      }
    } catch {
      setError('Erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  const model = VIDEO_MODELS.find((m) => m.provider === selectedProvider)

  return (
    <div className="flex flex-col h-full">
      {/* Result area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col">
        {!videoUrl && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center mb-4 text-3xl">🎬</div>
            <h2 className="text-xl font-semibold mb-2">Génération vidéo IA</h2>
            <p className="text-sm text-[#a1a1aa] max-w-md">
              Décrivez une scène et laissez l'IA générer une vidéo cinématique de 5 à 10 secondes.
            </p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
              {VIDEO_MODELS.map((m) => (
                <div key={m.provider} className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                  <span className="text-xs font-medium">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            {/* Animated video placeholder */}
            <div
              className="w-full max-w-xl rounded-2xl border border-[#27272a] bg-[#18181b] flex items-center justify-center"
              style={{ aspectRatio: aspectRatio.replace(':', '/'), maxHeight: 360 }}
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin" style={{ color: model?.color ?? '#0ea5e9' }} />
                <p className="text-sm font-medium" style={{ color: model?.color ?? '#0ea5e9' }}>{model?.name}</p>
              </div>
            </div>
            <p className="text-sm text-[#71717a]">{status || 'Démarrage…'}</p>
            <p className="text-xs text-[#52525b]">La génération vidéo peut prendre 1–3 minutes</p>
          </div>
        )}

        {videoUrl && (
          <div className="flex flex-col items-center gap-4">
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model?.color }} />
                <span className="text-sm font-medium">{model?.name}</span>
                {durationMs && <span className="text-xs text-[#52525b]">{(durationMs / 1000).toFixed(0)}s de génération</span>}
              </div>
              <a
                href={videoUrl}
                download={`meta-ai-${selectedProvider}-${Date.now()}.mp4`}
                className="flex items-center gap-1.5 text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors"
              >
                <Download size={12} /> Télécharger
              </a>
            </div>
            {/* Video player */}
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              className="w-full max-w-2xl rounded-2xl border border-[#27272a]"
              style={{ aspectRatio: aspectRatio.replace(':', '/'), maxHeight: 480 }}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-3 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Input zone */}
      <div className="border-t border-[#27272a] bg-[#09090b] p-4 space-y-3">
        {/* Provider selector */}
        <div className="flex flex-wrap gap-2">
          {VIDEO_MODELS.map((m) => {
            const active = selectedProvider === m.provider
            return (
              <button
                key={m.provider}
                onClick={() => setSelectedProvider(m.provider)}
                title={m.description}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={active ? {
                  backgroundColor: m.color + '20',
                  borderColor: m.color + '60',
                  color: m.color,
                } : {
                  backgroundColor: 'transparent',
                  borderColor: '#3f3f46',
                  color: '#71717a',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? m.color : '#52525b' }} />
                {m.name}
              </button>
            )
          })}
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#52525b]">Durée :</span>
            {DURATIONS.map((d) => (
              <button key={d.value} onClick={() => setDuration(d.value)}
                className={`px-3 py-1 rounded-lg text-xs border transition-colors ${duration === d.value ? 'border-[#0ea5e9] text-[#0ea5e9] bg-[#0ea5e9]/10' : 'border-[#3f3f46] text-[#71717a] hover:border-[#52525b]'}`}>
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#52525b]">Format :</span>
            {ASPECT_RATIOS.map((ar) => (
              <button key={ar.value} onClick={() => setAspectRatio(ar.value)}
                className={`px-3 py-1 rounded-lg text-xs border transition-colors ${aspectRatio === ar.value ? 'border-[#0ea5e9] text-[#0ea5e9] bg-[#0ea5e9]/10' : 'border-[#3f3f46] text-[#71717a] hover:border-[#52525b]'}`}>
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt + send */}
        <div className="flex items-end gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate() } }}
            disabled={loading}
            placeholder="Décrivez la scène vidéo… ex: un aigle survolant des montagnes enneigées au coucher du soleil, cinématique 4K"
            rows={1}
            className="flex-1 bg-[#18181b] border border-[#3f3f46] focus:border-[#0ea5e9] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors placeholder:text-[#52525b] disabled:opacity-50 max-h-32"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="w-10 h-10 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#0ea5e9' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
