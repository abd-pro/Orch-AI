'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl'

const shortcuts = [
  { keys: [`${mod}`, 'K'],    desc: 'Nouvelle conversation' },
  { keys: ['Enter'],          desc: 'Envoyer le message' },
  { keys: ['Shift', 'Enter'], desc: 'Nouvelle ligne' },
  { keys: [`${mod}`, 'Enter'],desc: 'Envoyer (alternative)' },
  { keys: ['/'],              desc: 'Focaliser la saisie' },
  { keys: ['?'],              desc: 'Afficher ce panneau' },
  { keys: ['Escape'],         desc: 'Fermer / Annuler' },
]

interface Props {
  onClose: () => void
}

export default function ShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
          <h2 className="text-sm font-semibold">Raccourcis clavier</h2>
          <button onClick={onClose} className="text-[#52525b] hover:text-[#a1a1aa] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <ul className="divide-y divide-[#27272a]/50">
          {shortcuts.map(({ keys, desc }) => (
            <li key={desc} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-[#d4d4d8]">{desc}</span>
              <div className="flex items-center gap-1">
                {keys.map((k, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <kbd className="bg-[#27272a] border border-[#3f3f46] rounded px-1.5 py-0.5 text-[11px] font-mono text-[#a1a1aa] leading-tight">
                      {k}
                    </kbd>
                    {i < keys.length - 1 && <span className="text-[#52525b] text-xs">+</span>}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
