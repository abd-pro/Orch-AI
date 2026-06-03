'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const TEMPLATES = [
  {
    category: 'Code',
    icon: '💻',
    prompts: [
      'Explique ce code ligne par ligne :',
      'Trouve les bugs dans ce code et propose des corrections :',
      'Optimise ce code pour améliorer les performances :',
      'Écris des tests unitaires pour cette fonction :',
      'Convertis ce code en TypeScript :',
      'Refactorise ce code pour le rendre plus lisible :',
    ],
  },
  {
    category: 'Créativité',
    icon: '✨',
    prompts: [
      'Écris une courte histoire captivante sur :',
      'Écris un poème sur le thème de :',
      'Propose 5 slogans créatifs pour :',
      'Suggère 10 noms de marque pour :',
      'Rédige une description produit convaincante pour :',
      'Écris un script de vidéo YouTube sur :',
    ],
  },
  {
    category: 'Analyse',
    icon: '🔍',
    prompts: [
      'Analyse les points forts et faibles de :',
      'Résume en 5 points clés :',
      'Compare et contraste :',
      'Fais une analyse SWOT de :',
      'Quels sont les risques et opportunités de :',
      'Donne ton avis critique sur :',
    ],
  },
  {
    category: 'Business',
    icon: '📊',
    prompts: [
      'Rédige un business plan concis pour :',
      'Rédige un email professionnel pour :',
      'Propose une stratégie marketing pour :',
      'Rédige un pitch de 30 secondes pour :',
      'Quels sont les KPIs à suivre pour :',
      'Propose une grille tarifaire pour :',
    ],
  },
  {
    category: 'Recherche',
    icon: '🔬',
    prompts: [
      'Explique simplement, comme à un enfant de 10 ans :',
      'Définis et explique le concept de :',
      'Quelles sont les dernières avancées sur :',
      'Liste les avantages et inconvénients de :',
      'Quelle est la différence entre',
      'Donne-moi des sources fiables sur :',
    ],
  },
  {
    category: 'Traduction',
    icon: '🌍',
    prompts: [
      'Traduis en anglais :',
      'Traduis en espagnol :',
      'Traduis en arabe :',
      'Traduis en allemand :',
      'Traduis en japonais :',
      'Traduis en portugais :',
    ],
  },
]

interface Props {
  onSelect: (prompt: string) => void
  onClose: () => void
}

export default function PromptTemplates({ onSelect, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState(TEMPLATES[0].category)
  const active = TEMPLATES.find((t) => t.category === activeCategory)!

  return (
    <div className="bg-[#111113] border border-white/8 rounded-2xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
        <p className="text-sm font-medium">Templates de prompts</p>
        <button onClick={onClose} className="text-[#52525b] hover:text-[#a1a1aa] transition-colors">
          <X size={15} />
        </button>
      </div>
      <div className="flex" style={{ maxHeight: 280 }}>
        {/* Catégories */}
        <div className="w-36 border-r border-[#27272a] p-2 space-y-0.5 overflow-y-auto shrink-0">
          {TEMPLATES.map((t) => (
            <button
              key={t.category}
              onClick={() => setActiveCategory(t.category)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                activeCategory === t.category
                  ? 'bg-[#cf7d56]/15 text-[#e8a07a]'
                  : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#27272a]'
              }`}
            >
              {t.icon} {t.category}
            </button>
          ))}
        </div>
        {/* Prompts */}
        <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {active.prompts.map((p, i) => (
            <button
              key={i}
              onClick={() => { onSelect(p); onClose() }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
