import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MarkdownMessage from '@/components/chat/MarkdownMessage'
import { AI_MODELS } from '@/lib/types'
import Link from 'next/link'
import OrchLogo from '@/components/OrchLogo'

interface SharedMessage {
  role: 'user' | 'assistant'
  content: string
  sourceAI?: string | null
  selectedAIs?: string[]
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = await createServiceClient()

  const { data, error } = await service
    .from('shared_conversations')
    .select('messages, created_at')
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const messages: SharedMessage[] = data.messages
  const date = new Date(data.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7]">
      {/* Header */}
      <div className="border-b border-[#27272a] bg-[#09090b] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OrchLogo size={28} />
            <span className="font-semibold text-[#fafafa]">orch<span className="text-[#cf7d56]">.AI</span></span>
            <span className="text-xs text-[#52525b] border border-[#27272a] rounded-full px-2 py-0.5">Conversation partagée</span>
          </div>
          <span className="text-xs text-[#52525b]">{date}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
            {msg.role === 'user' ? (
              <div className="max-w-[80%] bg-[#cf7d56]/15 border border-[#cf7d56]/20 rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[90%]">
                {msg.selectedAIs && msg.selectedAIs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {msg.selectedAIs.map((p) => {
                      const model = AI_MODELS.find((m) => m.provider === p)
                      return (
                        <span key={p} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: (model?.color ?? '#888') + '22', color: model?.color ?? '#888' }}>
                          {model?.name ?? p}
                        </span>
                      )
                    })}
                  </div>
                )}
                <div className="bg-[#18181b] border border-[#27272a] rounded-2xl rounded-tl-sm px-5 py-4">
                  <MarkdownMessage content={msg.content} />
                  {msg.sourceAI && (
                    <div className="mt-3 pt-3 border-t border-[#27272a] flex items-center gap-2">
                      <span className="text-xs text-[#52525b]">Réponse de</span>
                      {(() => {
                        const model = AI_MODELS.find((m) => m.provider === msg.sourceAI)
                        return (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: (model?.color ?? '#888') + '22', color: model?.color ?? '#888' }}>
                            {model?.name ?? msg.sourceAI}
                          </span>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="max-w-3xl mx-auto px-5 pb-12 text-center">
        <p className="text-sm text-[#52525b] mb-3">Essayez orch.AI gratuitement</p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#cf7d56] hover:bg-[#b86a43] transition-colors text-sm font-medium text-white"
        >
          Commencer une conversation
        </Link>
      </div>
    </div>
  )
}
