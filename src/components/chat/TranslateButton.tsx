'use client'

import { useState } from 'react'
import { Languages, X, Loader2 } from 'lucide-react'

const LANGUAGES = [
  { code: 'anglais', label: '🇬🇧 Anglais' },
  { code: 'espagnol', label: '🇪🇸 Espagnol' },
  { code: 'arabe', label: '🇸🇦 Arabe' },
  { code: 'allemand', label: '🇩🇪 Allemand' },
  { code: 'italien', label: '🇮🇹 Italien' },
  { code: 'portugais', label: '🇧🇷 Portugais' },
  { code: 'japonais', label: '🇯🇵 Japonais' },
  { code: 'chinois', label: '🇨🇳 Chinois' },
  { code: 'russe', label: '🇷🇺 Russe' },
  { code: 'français', label: '🇫🇷 Français' },
]

interface Props {
  text: string
}

export default function TranslateButton({ text }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [translated, setTranslated] = useState<string | null>(null)
  const [activeLang, setActiveLang] = useState<string | null>(null)

  async function translate(language: string) {
    setOpen(false)
    setLoading(true)
    setActiveLang(language)
    setTranslated(null)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      })
      const data = await res.json()
      setTranslated(data.translation ?? data.error ?? 'Erreur')
    } catch {
      setTranslated('Erreur de connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Traduire"
        className="flex items-center gap-1 text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors"
      >
        <Languages size={13} />
        {activeLang && !loading && <span>{activeLang}</span>}
        {loading && <Loader2 size={12} className="animate-spin" />}
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 left-0 bg-[#18181b] border border-[#27272a] rounded-xl shadow-xl z-50 py-1 min-w-[160px]">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => translate(l.code)}
              className="w-full text-left px-3 py-1.5 text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      {translated && (
        <div className="mt-3 bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-[#a1a1aa] relative">
          <button
            onClick={() => { setTranslated(null); setActiveLang(null) }}
            className="absolute top-2 right-2 text-[#52525b] hover:text-[#a1a1aa]"
          >
            <X size={13} />
          </button>
          <p className="text-xs text-[#52525b] mb-1.5">
            Traduction en {activeLang}
          </p>
          <p className="whitespace-pre-wrap leading-relaxed">{translated}</p>
        </div>
      )}
    </div>
  )
}
