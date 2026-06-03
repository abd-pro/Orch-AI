'use client'

import { useState, useEffect } from 'react'
import { Send, Download, AlertCircle, Loader2, RefreshCw, History, X, Trash2 } from 'lucide-react'
import OrchLogo from '@/components/OrchLogo'
import { IMAGE_MODELS, type ImageProvider, type GeneratedImage } from '@/lib/types'

const ASPECT_RATIOS = [
  { value: '1:1',  label: '1:1',  w: 1, h: 1 },
  { value: '16:9', label: '16:9', w: 16, h: 9 },
  { value: '9:16', label: '9:16', w: 9, h: 16 },
]

interface HistoryItem {
  id: string
  prompt: string
  aspectRatio: string
  createdAt: string
  results: { provider: ImageProvider; url: string }[]
}

const HISTORY_KEY = 'meta-ai-image-history'
const MAX_HISTORY = 20

function loadHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] }
}

function saveHistory(items: HistoryItem[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY))) } catch {}
}

export default function ImagePage() {
  const [prompt, setPrompt] = useState('')
  const [selectedProviders, setSelectedProviders] = useState<ImageProvider[]>(['dalle'])
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [results, setResults] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => { setHistory(loadHistory()) }, [])

  function toggleProvider(p: ImageProvider) {
    setSelectedProviders((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]
    )
  }

  async function handleGenerate() {
    if (!prompt.trim() || loading || selectedProviders.length === 0) return
    setError('')
    setLoading(true)
    setResults([])
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), providers: selectedProviders, aspectRatio }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur de génération'); return }
      setResults(data.results)

      // Sauvegarder dans l'historique (URLs uniquement, pas les base64)
      const successResults = (data.results as GeneratedImage[]).filter(
        (r) => r.historyUrl || (r.url && !r.url.startsWith('data:'))
      )
      if (successResults.length > 0) {
        const item: HistoryItem = {
          id: crypto.randomUUID(),
          prompt: prompt.trim(),
          aspectRatio,
          createdAt: new Date().toISOString(),
          results: successResults.map((r) => ({ provider: r.provider, url: r.historyUrl ?? r.url! })),
        }
        const updated = [item, ...loadHistory()]
        saveHistory(updated)
        setHistory(updated)
      }
    } catch {
      setError('Erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  async function downloadImage(url: string, provider: string) {
    const a = document.createElement('a')
    if (url.startsWith('data:')) {
      a.href = url
    } else {
      const res = await fetch(url)
      const blob = await res.blob()
      a.href = URL.createObjectURL(blob)
    }
    a.download = `orch-ai-${provider}-${Date.now()}.png`
    a.click()
  }

  function deleteHistoryItem(id: string) {
    const updated = history.filter((h) => h.id !== id)
    setHistory(updated)
    saveHistory(updated)
  }

  function restoreFromHistory(item: HistoryItem) {
    setPrompt(item.prompt)
    setAspectRatio(item.aspectRatio)
    setResults(item.results.map((r) => ({ provider: r.provider, url: r.url })))
    setShowHistory(false)
  }

  const colsClass = results.length === 1 ? 'grid-cols-1 max-w-lg' :
                    results.length === 2 ? 'grid-cols-2' :
                    results.length >= 3  ? 'grid-cols-3' : ''

  return (
    <div className="flex flex-col h-full relative overflow-hidden">

      {/* Barre titre */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--bdr)] shrink-0">
        <h1 className="text-sm font-semibold text-[var(--fg)]">Génération d'images</h1>
        <button
          onClick={() => setShowHistory((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
            showHistory
              ? 'border-[#cf7d56] text-[#cf7d56] bg-[#cf7d56]/10'
              : 'border-[var(--bdr)] text-[var(--mu2)] hover:border-[var(--mu3)] hover:text-[var(--mu1)]'
          }`}
        >
          <History size={12} />
          Historique {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      {/* Panel historique latéral */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-[var(--bg-alt)] border-l border-[var(--bdr)] z-40 flex flex-col transition-transform duration-300 ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--bdr)]">
          <h2 className="text-sm font-semibold">Historique</h2>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                onClick={() => { setHistory([]); saveHistory([]) }}
                className="text-xs text-[var(--mu3)] hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Tout effacer
              </button>
            )}
            <button onClick={() => setShowHistory(false)} className="text-[var(--mu3)] hover:text-[var(--mu1)] transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-[var(--mu3)] text-sm">Aucune génération sauvegardée</p>
              <p className="text-xs text-[var(--mu3)] mt-1 opacity-60">Les images générées apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="border border-[var(--bdr)] rounded-xl p-3 space-y-2 bg-[var(--surface)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--tx1)] line-clamp-2">{item.prompt}</p>
                      <p className="text-[10px] text-[var(--mu3)] mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{item.aspectRatio}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => restoreFromHistory(item)}
                        className="text-[10px] px-2 py-0.5 rounded-md border border-[var(--bdr)] text-[var(--mu2)] hover:border-[#cf7d56] hover:text-[#cf7d56] transition-colors"
                      >
                        Utiliser
                      </button>
                      <button onClick={() => deleteHistoryItem(item.id)} className="text-[var(--mu3)] hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className={`grid gap-1.5 ${item.results.length === 1 ? 'grid-cols-1' : item.results.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {item.results.map((r) => {
                      const model = IMAGE_MODELS.find((m) => m.provider === r.provider)
                      return (
                        <div key={r.provider} className="space-y-0.5">
                          <p className="text-[10px] text-[var(--mu3)]">{model?.name}</p>
                          <img
                            src={r.url}
                            alt={item.prompt}
                            className="w-full rounded-lg border border-[var(--bdr)] object-cover"
                            style={{ aspectRatio: item.aspectRatio.replace(':', '/'), maxHeight: 120 }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone résultats */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {results.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4"><OrchLogo size={56} /></div>
            <h2 className="text-xl font-semibold mb-2">Génération d'images IA</h2>
            <p className="text-sm text-[#a1a1aa] max-w-md">
              Décrivez l'image souhaitée, sélectionnez les IA et comparez les résultats côte à côte.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 size={32} className="text-[#cf7d56] animate-spin" />
            <p className="text-sm text-[#71717a]">Génération en cours avec {selectedProviders.length} IA…</p>
            <p className="text-xs text-[#52525b]">Cela peut prendre 10–30 secondes</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#52525b]">{results.length} résultat{results.length > 1 ? 's' : ''} — <span className="text-[#a1a1aa]">{prompt}</span></p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[#3f3f46] text-[#71717a] hover:border-[#cf7d56] hover:text-[#cf7d56] transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={12} /> Regénérer
                </button>
              </div>
            </div>
            <div className={`grid gap-4 mx-auto w-full ${colsClass}`}>
              {results.map((r) => {
                const model = IMAGE_MODELS.find((m) => m.provider === r.provider)
                return (
                  <div key={r.provider} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model?.color ?? '#888' }} />
                        <span className="text-sm font-medium">{model?.name}</span>
                        {r.durationMs && <span className="text-xs text-[#52525b]">{(r.durationMs / 1000).toFixed(1)}s</span>}
                      </div>
                      {r.url && (
                        <button
                          onClick={() => downloadImage(r.url!, r.provider)}
                          className="flex items-center gap-1 text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                        >
                          <Download size={12} /> Télécharger
                        </button>
                      )}
                    </div>
                    {r.url ? (
                      <img
                        src={r.url}
                        alt={`${model?.name} — ${prompt}`}
                        className="w-full rounded-xl border border-[#27272a] object-cover"
                        style={{ aspectRatio: aspectRatio.replace(':', '/') }}
                      />
                    ) : (
                      <div
                        className="w-full rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-center p-6"
                        style={{ aspectRatio: aspectRatio.replace(':', '/') }}
                      >
                        <div className="text-center">
                          <AlertCircle size={20} className="text-red-400 mx-auto mb-2" />
                          <p className="text-xs text-red-400">{r.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-6 mb-3 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Input zone */}
      <div className="border-t border-[#27272a] bg-[#09090b] p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {IMAGE_MODELS.map((m) => {
            const active = selectedProviders.includes(m.provider)
            return (
              <button
                key={m.provider}
                onClick={() => toggleProvider(m.provider)}
                title={m.description}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={active ? { backgroundColor: m.color + '20', borderColor: m.color + '60', color: m.color }
                              : { backgroundColor: 'transparent', borderColor: '#3f3f46', color: '#71717a' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? m.color : '#52525b' }} />
                {m.name}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#52525b] shrink-0">Format :</span>
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.value}
              onClick={() => setAspectRatio(ar.value)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border transition-colors ${
                aspectRatio === ar.value ? 'border-[#cf7d56] text-[#cf7d56] bg-[#cf7d56]/10' : 'border-[#3f3f46] text-[#71717a] hover:border-[#52525b]'
              }`}
            >
              <span className="inline-block border border-current rounded-[2px]"
                style={{ width: ar.w * 8, height: ar.h * 8, minWidth: 8, minHeight: 8, maxWidth: 20, maxHeight: 20 }}
              />
              {ar.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate() } }}
            disabled={loading}
            placeholder="Décrivez l'image que vous souhaitez générer…"
            rows={1}
            className="flex-1 bg-[#18181b] border border-[#3f3f46] focus:border-[#cf7d56] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors placeholder:text-[#52525b] disabled:opacity-50 max-h-32"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading || selectedProviders.length === 0}
            className="w-10 h-10 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#cf7d56' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
