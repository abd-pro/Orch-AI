'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/components/providers/ThemeProvider'

interface Props {
  code: string
}

function sanitizeMermaid(code: string): string {
  return code
    .normalize('NFC')                                          // normalize unicode
    .replace(/\u2192\u2192/g, '-->')                           // →→ → -->
    .replace(/\u2192/g, '->')                                  // → → ->
    .replace(/\|([^|\n>]*?)>/gm, (_, label) =>                 // -->|text> → -->|text|
      `|${label.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}|`
    )
    .replace(/\[([^\]\n]*?)\]/g, (_, txt) =>                   // strip accents in node labels too
      `[${txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/'/g, ' ')}]`
    )
}

export default function MermaidDiagram({ code }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const { theme } = useTheme()

  const sanitized = sanitizeMermaid(code)

  useEffect(() => {
    setError(false)
    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        const isDark = theme === 'dark'
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'base',
          themeVariables: isDark
            ? {
                primaryColor: '#cf7d56',
                primaryTextColor: '#e4e4e7',
                primaryBorderColor: '#b86a43',
                lineColor: '#cf7d56',
                secondaryColor: '#18181b',
                tertiaryColor: '#27272a',
                background: '#18181b',
                mainBkg: '#27272a',
                nodeBorder: '#cf7d56',
                clusterBkg: '#18181b',
                titleColor: '#e4e4e7',
                edgeLabelBackground: '#27272a',
              }
            : {
                primaryColor: '#cf7d56',
                primaryTextColor: '#18181b',
                primaryBorderColor: '#b86a43',
                lineColor: '#cf7d56',
                secondaryColor: '#f4f4f5',
                tertiaryColor: '#e4e4e7',
                background: '#ffffff',
                mainBkg: '#f4f4f5',
                nodeBorder: '#cf7d56',
                clusterBkg: '#f4f4f5',
                titleColor: '#18181b',
                edgeLabelBackground: '#f4f4f5',
              },
        })
        // Validate before rendering to prevent Mermaid injecting error nodes into DOM
        try {
          await mermaid.parse(sanitized)
        } catch {
          setError(true)
          return
        }
        const id = `mermaid-${Math.random().toString(36).slice(2)}`
        const { svg } = await mermaid.render(id, sanitized)
        if (ref.current) ref.current.innerHTML = svg
      } catch {
        setError(true)
      }
    }
    render()
  }, [sanitized, theme])

  if (error) return (
    <pre className="bg-[#09090b] border border-[#27272a] p-3 rounded-lg text-xs font-mono text-[#a1a1aa] overflow-x-auto">
      {sanitized}
    </pre>
  )

  return (
    <div
      ref={ref}
      className="my-3 flex justify-center bg-[#18181b] border border-[#27272a] rounded-xl p-4 overflow-x-auto"
      style={{ maxHeight: '260px' }}
    />
  )
}
