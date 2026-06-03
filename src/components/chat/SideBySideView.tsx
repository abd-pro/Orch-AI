'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AI_MODELS, type AIProvider, type Category, type AIResponse } from '@/lib/types'
import FeedbackButtons from './FeedbackButtons'

interface Props {
  responses: AIResponse[]
  category: Category
}

export default function SideBySideView({ responses, category }: Props) {
  const valid = responses.filter((r) => !r.error && r.content)

  if (valid.length === 0) return null

  return (
    <div className="mt-4 overflow-x-auto pb-1">
      <div className="flex gap-3" style={{ minWidth: `${valid.length * 280}px` }}>
        {valid.map((response) => {
          const model = AI_MODELS.find((m) => m.provider === response.provider)
          return (
            <div
              key={response.provider}
              className="flex-1 min-w-[260px] max-w-sm border border-[#27272a] rounded-xl overflow-hidden bg-[#09090b] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#18181b] border-b border-[#27272a] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: model?.color ?? '#888' }} />
                  <span className="text-xs font-medium">{model?.name ?? response.provider}</span>
                  {response.durationMs && (
                    <span className="text-[10px] text-[#52525b]">{(response.durationMs / 1000).toFixed(1)}s</span>
                  )}
                </div>
                <FeedbackButtons provider={response.provider as AIProvider} category={category} />
              </div>
              {/* Content */}
              <div className="p-3 overflow-y-auto max-h-72 text-xs leading-[1.7] text-[#d4d4d8] space-y-2">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="leading-[1.7]">{children}</p>,
                    ul: ({ children }) => <ul className="space-y-1 pl-3">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-1 pl-3 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-[#e4e4e7]">{children}</strong>,
                    code: ({ className, children }) => {
                      const isBlock = !!className
                      return isBlock ? (
                        <pre className="bg-[#18181b] border border-[#27272a] rounded-lg p-2 overflow-x-auto my-1">
                          <code className="text-[11px] font-mono text-[#a78bfa]">{children}</code>
                        </pre>
                      ) : (
                        <code className="bg-[#27272a] px-1 py-0.5 rounded text-[11px] font-mono text-[#a78bfa]">{children}</code>
                      )
                    },
                    pre: ({ children }) => <>{children}</>,
                    h1: ({ children }) => <p className="font-bold text-[#e4e4e7]">{children}</p>,
                    h2: ({ children }) => <p className="font-semibold text-[#e4e4e7]">{children}</p>,
                    h3: ({ children }) => <p className="font-medium text-[#a78bfa]">{children}</p>,
                  }}
                >
                  {response.content}
                </ReactMarkdown>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
