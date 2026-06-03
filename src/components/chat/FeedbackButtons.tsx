'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import type { AIProvider, Category } from '@/lib/types'

interface Props {
  provider: AIProvider
  category: Category
  isFinalResponse?: boolean
}

export default function FeedbackButtons({ provider, category, isFinalResponse = false }: Props) {
  const [voted, setVoted] = useState<1 | -1 | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleVote(rating: 1 | -1) {
    if (voted !== null || loading) return
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, category, rating, isFinalResponse }),
      })
      setVoted(rating)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={voted !== null || loading}
        title="Bonne réponse"
        style={voted === 1 ? { transform: 'scale(1.15)' } : undefined}
        className={`p-1.5 rounded-lg transition-all duration-200 disabled:cursor-default ${
          voted === 1
            ? 'text-white bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
            : voted === -1
            ? 'text-[#3f3f46] opacity-40 cursor-not-allowed'
            : 'text-[#71717a] hover:text-emerald-400 hover:bg-emerald-400/15 hover:scale-110'
        }`}
      >
        <ThumbsUp size={13} strokeWidth={voted === 1 ? 2.5 : 2} />
      </button>
      <button
        onClick={() => handleVote(-1)}
        disabled={voted !== null || loading}
        title="Mauvaise réponse"
        style={voted === -1 ? { transform: 'scale(1.15)' } : undefined}
        className={`p-1.5 rounded-lg transition-all duration-200 disabled:cursor-default ${
          voted === -1
            ? 'text-white bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
            : voted === 1
            ? 'text-[#3f3f46] opacity-40 cursor-not-allowed'
            : 'text-[#71717a] hover:text-red-400 hover:bg-red-400/15 hover:scale-110'
        }`}
      >
        <ThumbsDown size={13} strokeWidth={voted === -1 ? 2.5 : 2} />
      </button>
    </div>
  )
}
