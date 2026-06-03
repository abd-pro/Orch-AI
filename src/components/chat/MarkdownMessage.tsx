'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import MermaidDiagram from './MermaidDiagram'

interface Props {
  content: string
  isStreaming?: boolean
}

export default function MarkdownMessage({ content, isStreaming }: Props) {
  return (
    <div className="text-sm leading-7 text-[var(--tx1)] space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-[var(--fg)] mt-6 mb-3 pb-2 border-b border-[var(--sur2)]">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-[var(--fg)] mt-5 mb-2 pb-1 border-b border-[var(--sur2)]/50">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-[var(--fg)] mt-4 mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="leading-7 text-[var(--tx2)]">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 pl-1 list-none counter-reset-item">{children}</ol>
          ),
          li: ({ children, ...props }) => {
            const isOrdered = (props as { ordered?: boolean }).ordered
            return (
              <li className={`flex items-start gap-2.5 leading-7 ${isOrdered ? '' : ''}`}>
                <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-[#cf7d56] block" />
                <span className="text-[var(--tx2)]">{children}</span>
              </li>
            )
          },
          code: ({ className, children }) => {
            const lang = className?.replace('language-', '') ?? ''
            const code = String(children).trim()

            // Rendu Mermaid
            if (lang === 'mermaid') {
              return <MermaidDiagram code={code} />
            }

            // Rendu SVG inline
            if (lang === 'svg') {
              // Force width/height sur le SVG pour éviter qu'il prenne tout l'écran
              const resized = code
                .replace(/<svg([^>]*)>/i, (_, attrs) => {
                  const cleaned = attrs
                    .replace(/\s*width="[^"]*"/gi, '')
                    .replace(/\s*height="[^"]*"/gi, '')
                  return `<svg${cleaned} width="100%" height="auto" style="max-width:320px;max-height:240px;display:block;margin:auto">`
                })
              return (
                <div className="my-3 flex justify-center bg-[var(--surface)] border border-[var(--sur2)] rounded-xl p-4">
                  <div dangerouslySetInnerHTML={{ __html: resized }} />
                </div>
              )
            }

            const isBlock = !!lang
            return isBlock ? (
              <div className="my-3 rounded-xl overflow-hidden border border-[var(--sur2)]">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#09090b] border-b border-[#27272a]">
                  <span className="w-3 h-3 rounded-full bg-red-500/60" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <span className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-xs text-[#52525b] font-mono">{lang || 'code'}</span>
                </div>
                <pre className="bg-[#0d0d0f] p-4 overflow-x-auto">
                  <code className="text-xs font-mono text-[#d4d4d8] leading-6">{children}</code>
                </pre>
              </div>
            ) : (
              <code className="bg-[var(--sur2)] border border-[var(--bdr)] px-1.5 py-0.5 rounded-md text-xs font-mono text-[var(--tx2)]">
                {children}
              </code>
            )
          },
          pre: ({ children }) => <>{children}</>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--fg)]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[var(--mu1)]">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#cf7d56] pl-4 py-1 bg-[#cf7d56]/5 rounded-r-lg my-3 text-[var(--mu1)] italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-[#cf7d56] hover:text-[#d4d4d8] underline underline-offset-2 transition-colors"
              target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          hr: () => <hr className="border-[var(--sur2)] my-4" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-[var(--sur2)]">
              <table className="text-xs w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[var(--sur2)]">{children}</thead>,
          th: ({ children }) => (
            <th className="px-4 py-2.5 font-semibold text-[var(--fg)] text-left border-b border-[var(--bdr)]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 border-b border-[var(--sur2)]/50 text-[var(--tx2)]">{children}</td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[var(--surface)] transition-colors">{children}</tr>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 bg-[#cf7d56] animate-pulse ml-0.5 align-middle rounded-sm" />
      )}
    </div>
  )
}
