'use client'

import { useState, useEffect } from 'react'
import { Check, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react'
import { AI_MODELS, type AIProvider } from '@/lib/types'

const PROVIDER_LINKS: Record<AIProvider, { label: string; url: string }> = {
  openai:     { label: 'platform.openai.com/api-keys',     url: 'https://platform.openai.com/api-keys' },
  anthropic:  { label: 'console.anthropic.com',            url: 'https://console.anthropic.com' },
  gemini:     { label: 'aistudio.google.com',              url: 'https://aistudio.google.com' },
  mistral:    { label: 'console.mistral.ai',               url: 'https://console.mistral.ai' },
  perplexity: { label: 'perplexity.ai/settings/api',       url: 'https://www.perplexity.ai/settings/api' },
  grok:       { label: 'console.x.ai',                     url: 'https://console.x.ai' },
  deepseek:   { label: 'platform.deepseek.com/api_keys',   url: 'https://platform.deepseek.com/api_keys' },
  groq:       { label: 'console.groq.com/keys',            url: 'https://console.groq.com/keys' },
}

export default function APIKeysPage() {
  const [connected, setConnected] = useState<AIProvider[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/keys')
      .then((r) => r.json())
      .then((data) => setConnected(data.connected ?? []))
  }, [])

  async function handleSave(provider: AIProvider) {
    const key = inputs[provider]?.trim()
    if (!key) return

    setSaving((p) => ({ ...p, [provider]: true }))
    setError((p) => ({ ...p, [provider]: '' }))

    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, key }),
    })

    if (res.ok) {
      setConnected((p) => [...new Set([...p, provider])])
      setInputs((p) => ({ ...p, [provider]: '' }))
      setSaved((p) => ({ ...p, [provider]: true }))
      setTimeout(() => setSaved((p) => ({ ...p, [provider]: false })), 2000)
    } else {
      setError((p) => ({ ...p, [provider]: 'Erreur lors de la sauvegarde' }))
    }

    setSaving((p) => ({ ...p, [provider]: false }))
  }

  async function handleDelete(provider: AIProvider) {
    const res = await fetch(`/api/keys?provider=${provider}`, { method: 'DELETE' })
    if (res.ok) {
      setConnected((p) => p.filter((c) => c !== provider))
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">Clés API</h1>
      <p className="text-sm text-[#a1a1aa] mb-8">
        Vos clés sont chiffrées et stockées de façon sécurisée. Elles ne sont jamais exposées côté client.
      </p>

      <div className="space-y-4">
        {AI_MODELS.map((ai) => {
          const isConnected = connected.includes(ai.provider)
          const link = PROVIDER_LINKS[ai.provider]

          return (
            <div key={ai.provider} className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ai.color }}></div>
                  <div>
                    <h3 className="font-medium">{ai.name}</h3>
                    <p className="text-xs text-[#a1a1aa]">{ai.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      <Check size={10} />
                      Connectée
                    </span>
                  )}
                  {isConnected && (
                    <button
                      onClick={() => handleDelete(ai.provider)}
                      className="text-[#52525b] hover:text-red-400 transition-colors p-1"
                      title="Supprimer la clé"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={visible[ai.provider] ? 'text' : 'password'}
                    value={inputs[ai.provider] ?? ''}
                    onChange={(e) => setInputs((p) => ({ ...p, [ai.provider]: e.target.value }))}
                    placeholder={isConnected ? '••••••••••••• (clé sauvegardée)' : 'Coller votre clé API ici'}
                    className="w-full bg-[#09090b] border border-[#3f3f46] rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:border-[#cf7d56] transition-colors placeholder:text-[#52525b]"
                  />
                  <button
                    onClick={() => setVisible((p) => ({ ...p, [ai.provider]: !p[ai.provider] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                  >
                    {visible[ai.provider] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  onClick={() => handleSave(ai.provider)}
                  disabled={!inputs[ai.provider]?.trim() || saving[ai.provider]}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#cf7d56] hover:bg-[#b86a43] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {saved[ai.provider] ? <Check size={14} /> : saving[ai.provider] ? '...' : 'Sauvegarder'}
                </button>
              </div>

              {error[ai.provider] && (
                <p className="mt-2 text-xs text-red-400">{error[ai.provider]}</p>
              )}

              {link && (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1 text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                >
                  <ExternalLink size={11} />
                  Obtenir une clé : {link.label}
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
