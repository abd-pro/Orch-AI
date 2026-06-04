'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Send, TableIcon, ChevronDown, ChevronUp, AlertCircle, RotateCcw, Settings2, Paperclip, X, FileText, Download, Share2, Check, Globe, Columns2, Wand2, LayoutTemplate, Swords, Link, Copy } from 'lucide-react'
import AISelector from '@/components/chat/AISelector'
import ComparisonTable from '@/components/chat/ComparisonTable'
import FeedbackButtons from '@/components/chat/FeedbackButtons'
import MarkdownMessage from '@/components/chat/MarkdownMessage'
import ShortcutsModal from '@/components/chat/ShortcutsModal'
import OrchLogo from '@/components/OrchLogo'
import SideBySideView from '@/components/chat/SideBySideView'
import PersonaSelector, { PERSONAS, type Persona } from '@/components/chat/PersonaSelector'
import PromptTemplates from '@/components/chat/PromptTemplates'
import TranslateButton from '@/components/chat/TranslateButton'
import DebateView from '@/components/chat/DebateView'
import type { DebateResponse } from '@/lib/ai/orchestrator'
import {
  AI_MODELS,
  RECOMMENDED_AIS,
  type AIProvider,
  type Category,
  type AIResponse,
  VISITOR_LIFETIME_LIMIT,
  FREE_MONTHLY_LIMIT,
} from '@/lib/types'

type AttachedFile =
  | { kind: 'text'; name: string; content: string }
  | { kind: 'image'; name: string; base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; preview: string }

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  aiResponses?: AIResponse[]
  arbitratorAI?: string | null
  sourceAI?: string | null
  selectedAIs?: AIProvider[]
  isStreaming?: boolean
  category?: Category
  fileName?: string
  fileImagePreview?: string
  suggestions?: string[]
  sources?: { title: string; url: string }[]
  divergence?: 'faible' | 'modéré' | 'élevé'
  divergenceReason?: string
  debateData?: { debate: DebateResponse[]; verdict?: string }
}

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlConversationId = searchParams.get('id')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [limitReached, setLimitReached] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showSelector, setShowSelector] = useState(true)
  const [category, setCategory] = useState<Category>('general')
  const [selectedAIs, setSelectedAIs] = useState<AIProvider[]>(RECOMMENDED_AIS.general)
  const [showComparison, setShowComparison] = useState<Record<string, boolean>>({})
  const [showSideBySide, setShowSideBySide] = useState<Record<string, boolean>>({})

  // Personas
  const [showPersonas, setShowPersonas] = useState(false)
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null)

  // Custom prompt
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')

  // File upload
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Live AI streaming state
  const [liveAiResponses, setLiveAiResponses] = useState<AIResponse[]>([])
  const [pendingAIs, setPendingAIs] = useState<AIProvider[]>([])

  // Share
  const [shareLoading, setShareLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)

  // New features
  const [showTemplates, setShowTemplates] = useState(false)
  const [isDebateMode, setIsDebateMode] = useState(false)
  const [debateLoading, setDebateLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Usage counter
  const [usagePlan, setUsagePlan] = useState<string | null>(null)
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null)
  const [usageLimit, setUsageLimit] = useState<number | null>(null)
  const [allowedAIs, setAllowedAIs] = useState<AIProvider[] | undefined>(undefined)
  const [maxAIs, setMaxAIs] = useState<number | undefined>(undefined)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Charger les préférences sauvegardées
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('meta-ai-prefs') ?? '{}')
      if (saved.category) setCategory(saved.category)
      if (saved.selectedAIs?.length) setSelectedAIs(saved.selectedAIs)
      if (saved.customPrompt) { setCustomPrompt(saved.customPrompt); setShowCustomPrompt(true) }
      if (saved.activePersonaId) setActivePersonaId(saved.activePersonaId)
    } catch {}
  }, [])

  // Sauvegarder les préférences à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem('meta-ai-prefs', JSON.stringify({ selectedAIs, category, customPrompt, activePersonaId }))
    } catch {}
  }, [selectedAIs, category, customPrompt])

  // Charger le compteur d'usage au montage
  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.json())
      .then(({ plan, remaining, limit, allowedAIs: allowed, maxAIs: max }) => {
        setUsagePlan(plan)
        setUsageRemaining(remaining)
        setUsageLimit(limit)
        if (allowed) setAllowedAIs(allowed as AIProvider[])
        if (max) setMaxAIs(max)
        // Filtrer les IA sélectionnées selon le plan
        if (allowed) {
          setSelectedAIs((prev) => {
            const filtered = prev.filter((ai) => (allowed as AIProvider[]).includes(ai))
            if (filtered.length === 0) return [(allowed as AIProvider[])[0]]
            if (max && filtered.length > max) return filtered.slice(0, max)
            return filtered
          })
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!urlConversationId) {
      setMessages([])
      setConversationId(null)
      return
    }
    async function loadConversation() {
      const res = await fetch(`/api/conversations/${urlConversationId}`)
      if (!res.ok) return
      const data = await res.json()
      setConversationId(urlConversationId)
      setMessages(
        data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; ai_responses: AIResponse[]; selected_ais: AIProvider[]; arbitrator_ai: string | null }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          aiResponses: m.ai_responses,
          selectedAIs: m.selected_ais,
          arbitratorAI: m.arbitrator_ai,
          // La réponse affichée EST celle d'une IA → on retrouve laquelle par son contenu
          sourceAI: m.ai_responses?.find((r) => r.content === m.content)?.provider ?? null,
        }))
      )
    }
    loadConversation()
  }, [urlConversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    const inInput = document.activeElement instanceof HTMLTextAreaElement ||
                    document.activeElement instanceof HTMLInputElement

    // ⌘/Ctrl+K → new conversation
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      router.push('/chat')
      return
    }
    // ⌘/Ctrl+Enter → send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
      return
    }
    // Escape → close modal or clear error
    if (e.key === 'Escape') {
      if (showShortcuts) { setShowShortcuts(false); return }
      setError('')
      return
    }
    // ? → open shortcuts (when not in an input)
    if (e.key === '?' && !inInput) {
      e.preventDefault()
      setShowShortcuts(true)
      return
    }
    // / → focus textarea (when not in an input)
    if (e.key === '/' && !inInput) {
      e.preventDefault()
      textareaRef.current?.focus()
    }
  }, [showShortcuts, router]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [handleGlobalKey])

  function toggleAI(provider: AIProvider) {
    setSelectedAIs((prev) =>
      prev.includes(provider)
        ? prev.length > 1 ? prev.filter((p) => p !== provider) : prev
        : [...prev, provider]
    )
  }

  function handleCategoryChange(newCategory: Category) {
    setCategory(newCategory)
    setSelectedAIs(RECOMMENDED_AIS[newCategory])
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setError('')

    const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const isImage = IMAGE_TYPES.includes(file.type)
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf')
    const TEXT_TYPES = ['text/', 'application/json', 'application/javascript']
    const isText = TEXT_TYPES.some((t) => file.type.startsWith(t)) ||
      file.name.match(/\.(txt|md|csv|json|js|ts|jsx|tsx|py|html|css|xml|yaml|yml|sh|sql)$/i)

    // ── Image ──────────────────────────────────────────────
    if (isImage) {
      if (file.size > 5_000_000) { setError('Image trop volumineuse (max 5 Mo).'); return }
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        const base64 = dataUrl.split(',')[1]
        setAttachedFile({
          kind: 'image',
          name: file.name,
          base64,
          mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          preview: dataUrl,
        })
      }
      reader.readAsDataURL(file)
      return
    }

    // ── PDF ────────────────────────────────────────────────
    if (isPDF) {
      if (file.size > 10_000_000) { setError('PDF trop volumineux (max 10 Mo).'); return }
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          const base64 = btoa(
            new Uint8Array(ev.target?.result as ArrayBuffer)
              .reduce((acc, byte) => acc + String.fromCharCode(byte), '')
          )
          const res = await fetch('/api/extract-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64 }),
          })
          const data = await res.json()
          if (!res.ok || data.error) { setError(data.error ?? 'Erreur lors de la lecture du PDF.'); return }
          setAttachedFile({ kind: 'text', name: file.name, content: data.text })
        } catch {
          setError('Impossible de lire ce PDF.')
        }
      }
      reader.readAsArrayBuffer(file)
      return
    }

    // ── Texte ──────────────────────────────────────────────
    if (isText) {
      if (file.size > 500_000) { setError('Fichier trop volumineux (max 500 Ko).'); return }
      const reader = new FileReader()
      reader.onload = (ev) => {
        setAttachedFile({ kind: 'text', name: file.name, content: ev.target?.result as string })
      }
      reader.readAsText(file)
      return
    }

    setError('Format non supporté. Acceptés : images (jpg, png, webp), PDF, txt, md, json, code…')
  }

  async function sendMessage(question: string, file?: AttachedFile) {
    const fileContent = file?.kind === 'text' ? file.content : undefined
    const fileName = file?.name
    const fileBase64 = file?.kind === 'image' ? file.base64 : undefined
    const fileMimeType = file?.kind === 'image' ? file.mimeType : undefined
    setError('')
    setLoading(true)
    setShowSelector(false)
    setLiveAiResponses([])
    setPendingAIs([...selectedAIs])

    const assistantId = crypto.randomUUID()

    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true, category },
    ])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          selectedAIs,
          ...(conversationId ? { conversationId } : {}),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          ...(customPrompt.trim() ? { customPrompt: customPrompt.trim() } : {}),
          ...(fileContent ? { fileContent, fileName } : {}),
          ...(fileBase64 && fileMimeType ? { fileBase64, fileMimeType } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.limitReached) setLimitReached(true)
        setError(data.error ?? 'Une erreur est survenue.')
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let responseContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          try {
            const event = JSON.parse(part.slice(6))

            if (event.type === 'ai_result') {
              if (!event.hasError && event.content) {
                const r: AIResponse = { provider: event.provider, content: event.content, durationMs: event.durationMs }
                setLiveAiResponses((prev) => [...prev, r])
              }
              setPendingAIs((prev) => prev.filter((p) => p !== event.provider))
            } else if (event.type === 'token') {
              responseContent += event.text
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content: m.content + event.text } : m)
              )
            } else if (event.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? {
                    ...m,
                    isStreaming: false,
                    aiResponses: event.aiResponses,
                    arbitratorAI: event.arbitratorAI,
                    sourceAI: event.sourceAI,
                    selectedAIs,
                  } : m
                )
              )
              if (event.conversationId && !conversationId) {
                setConversationId(event.conversationId)
                router.refresh()
                setTimeout(() => router.refresh(), 3000)
              }
              if (event.remaining !== undefined) {
                setRemaining(event.remaining)
                setUsageRemaining(event.remaining)
              }
              if (event.sources?.length) {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, sources: event.sources } : m)
                )
              }
              if (event.divergence) {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, divergence: event.divergence, divergenceReason: event.divergenceReason } : m)
                )
              }
              setLiveAiResponses([])
              setPendingAIs([])
              // Fetch follow-up suggestions asynchronously
              ;(async () => {
                try {
                  const suggestionsRes = await fetch('/api/suggestions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question, response: responseContent }),
                  })
                  const { suggestions } = await suggestionsRes.json()
                  if (Array.isArray(suggestions) && suggestions.length > 0) {
                    setMessages((prev) =>
                      prev.map((m) => m.id === assistantId ? { ...m, suggestions } : m)
                    )
                  }
                } catch {}
              })()
            } else if (event.type === 'error') {
              setError(event.message)
              setMessages((prev) => prev.filter((m) => m.id !== assistantId))
              setLiveAiResponses([])
              setPendingAIs([])
            } else if (event.type === 'limit') {
              setLimitReached(true)
              setMessages((prev) => prev.filter((m) => m.id !== assistantId))
            }
          } catch {}
        }
      }
    } catch {
      setError('Erreur de connexion. Réessayez.')
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setLoading(false)
      setShowSelector(true)
    }
  }

  function exportMarkdown() {
    if (messages.length === 0) return
    const lines: string[] = ['# Conversation orch.AI', `_Exportée le ${new Date().toLocaleDateString('fr-FR')}_`, '']
    for (const msg of messages) {
      if (msg.role === 'user') {
        lines.push('---', '', `**Vous :** ${msg.content}`, '')
      } else {
        const src = msg.sourceAI ?? 'IA'
        lines.push(`**Assistant (${src}) :**`, '', msg.content, '')
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meta-ai-${new Date().toISOString().slice(0, 10)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    if (messages.length === 0 || shareLoading) return
    setShareLoading(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            sourceAI: m.sourceAI ?? null,
            selectedAIs: m.selectedAIs ?? [],
          })),
        }),
      })
      const { id, error: shareError } = await res.json()
      if (shareError || !id) { setError('Impossible de créer le lien de partage.'); return }
      await navigator.clipboard.writeText(`${window.location.origin}/share/${id}`)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2500)
    } catch {
      setError('Erreur lors du partage.')
    } finally {
      setShareLoading(false)
    }
  }

  async function handleSummarize(url: string) {
    if (summaryLoading || loading) return
    setSummaryLoading(true)
    setError('')
    setShowSelector(false)
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: `Résume cette URL : ${url}` }
    const assistantId = crypto.randomUUID()
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: 'assistant', content: '', isStreaming: true }])
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Erreur lors du résumé.')
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } else {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: data.summary, isStreaming: false } : m)
        )
        setInput('')
      }
    } catch {
      setError('Erreur de connexion.')
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setSummaryLoading(false)
      setShowSelector(true)
    }
  }

  async function handleDebate() {
    if (!input.trim() || debateLoading || selectedAIs.length < 2) return
    const question = input.trim()
    setInput('')
    setError('')
    setDebateLoading(true)
    setShowSelector(false)
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: question }
    const assistantId = crypto.randomUUID()
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: 'assistant', content: 'Débat en cours…', isStreaming: true }])
    try {
      const res = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, selectedAIs }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Erreur lors du débat.')
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      } else {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? {
            ...m, content: '', isStreaming: false,
            debateData: { debate: data.debate, verdict: data.verdict },
          } : m)
        )
      }
    } catch {
      setError('Erreur de connexion.')
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setDebateLoading(false)
      setShowSelector(true)
    }
  }

  async function handleSendQuestion(question: string, file?: AttachedFile) {
    if (!question.trim() || loading || selectedAIs.length === 0) return
    setInput('')
    setAttachedFile(null)
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      fileName: file?.name,
      fileImagePreview: file?.kind === 'image' ? file.preview : undefined,
    }
    setMessages((prev) => [...prev, userMessage])
    await sendMessage(question, file)
  }

  async function handleSend() {
    if (!input.trim()) return
    if (isDebateMode) { await handleDebate(); return }
    const question = input.trim()
    const file = attachedFile ?? undefined
    await handleSendQuestion(question, file)
  }

  async function handleRegenerate() {
    if (loading) return
    // Find last user message (second-to-last or last user msg)
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    // Remove last assistant message
    setMessages((prev) => {
      const idx = prev.map((m) => m.id).lastIndexOf(prev.filter((m) => m.role === 'assistant').at(-1)?.id ?? '')
      return idx >= 0 ? prev.filter((_, i) => i !== idx) : prev
    })
    await sendMessage(lastUser.content)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function toggleComparison(messageId: string) {
    setShowComparison((prev) => ({ ...prev, [messageId]: !prev[messageId] }))
    setShowSideBySide((prev) => ({ ...prev, [messageId]: false }))
  }

  function toggleSideBySide(messageId: string) {
    setShowSideBySide((prev) => ({ ...prev, [messageId]: !prev[messageId] }))
    setShowComparison((prev) => ({ ...prev, [messageId]: false }))
  }

  function handlePersonaSelect(persona: Persona) {
    if (!persona.id) {
      // désactiver
      setActivePersonaId(null)
      setCustomPrompt('')
      setShowCustomPrompt(false)
    } else {
      setActivePersonaId(persona.id)
      setCustomPrompt(persona.prompt)
      setShowCustomPrompt(true)
    }
    setShowPersonas(false)
  }

  const lastAssistantIndex = messages.map((m, i) => m.role === 'assistant' ? i : -1).filter((i) => i >= 0).at(-1) ?? -1

  return (
    <div className="flex flex-col h-full">
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Export / Partage */}
        {messages.length > 0 && !loading && (
          <div className="flex items-center justify-end gap-1.5 px-5 pt-3 pb-0">
            <button
              onClick={exportMarkdown}
              className="flex items-center gap-1.5 text-[11px] text-[var(--mu3)] hover:text-[var(--mu1)] transition-all px-2.5 py-1 rounded-lg hover:bg-white/4"
            >
              <Download size={11} />
              Exporter
            </button>
            <button
              onClick={handleShare}
              disabled={shareLoading}
              className="flex items-center gap-1.5 text-[11px] text-[var(--mu3)] hover:text-[var(--mu1)] transition-all px-2.5 py-1 rounded-lg hover:bg-white/4 disabled:opacity-50"
            >
              {shareCopied ? <Check size={11} className="text-emerald-400" /> : <Share2 size={11} />}
              <span className={shareCopied ? 'text-emerald-400' : ''}>{shareCopied ? 'Copié !' : 'Partager'}</span>
            </button>
          </div>
        )}

        {messages.length === 0 && !isDebateMode && (
          <div className="flex flex-col items-center justify-center h-full text-center select-none">
            <div className="mb-5">
              <OrchLogo size={48} />
            </div>
            <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">Posez votre question</h2>
            <p className="text-sm text-[var(--mu3)] max-w-sm leading-relaxed">
              Sélectionnez les IA, choisissez une catégorie, puis envoyez votre question.
            </p>
          </div>
        )}

        {messages.length === 0 && isDebateMode && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center mb-4 text-3xl">
              ⚔️
            </div>
            <h2 className="text-xl font-semibold mb-2">Mode Débat</h2>
            <p className="text-sm text-[var(--mu1)] max-w-sm mb-6">
              Deux IA s'affrontent sur votre sujet — l'une POUR, l'autre CONTRE.
              {selectedAIs.length >= 3 && ' Une troisième arbitre.'}
            </p>
            <div className="flex items-center gap-3 text-xs">
              {selectedAIs[0] && (() => {
                const m = AI_MODELS.find((x) => x.provider === selectedAIs[0])
                return (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <span>✅</span><span className="font-medium">POUR</span>
                    <span className="text-[var(--mu3)]">·</span>
                    <span style={{ color: m?.color }}>{m?.name}</span>
                  </div>
                )
              })()}
              <span className="text-[var(--mu3)] text-lg">vs</span>
              {selectedAIs[1] && (() => {
                const m = AI_MODELS.find((x) => x.provider === selectedAIs[1])
                return (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <span>❌</span><span className="font-medium">CONTRE</span>
                    <span className="text-[var(--mu3)]">·</span>
                    <span style={{ color: m?.color }}>{m?.name}</span>
                  </div>
                )
              })()}
              {selectedAIs[2] && (() => {
                const m = AI_MODELS.find((x) => x.provider === selectedAIs[2])
                return (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#cf7d56]/10 border border-[#cf7d56]/20 text-[#e8a07a] ml-1">
                    <span>⚖️</span><span className="font-medium">ARBITRE</span>
                    <span className="text-[var(--mu3)]">·</span>
                    <span style={{ color: m?.color }}>{m?.name}</span>
                  </div>
                )
              })()}
            </div>
            {selectedAIs.length < 2 && (
              <p className="mt-4 text-xs text-amber-400">Sélectionnez au moins 2 IA pour lancer un débat.</p>
            )}
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={msg.id} className={`animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
            {msg.role === 'user' ? (
              <div className="max-w-[80%] space-y-1.5">
                {/* Image preview */}
                {msg.fileImagePreview && (
                  <div className="flex justify-end">
                    <img
                      src={msg.fileImagePreview}
                      alt={msg.fileName ?? 'image'}
                      className="max-w-[240px] max-h-[180px] rounded-xl border border-[var(--sur2)] object-cover"
                    />
                  </div>
                )}
                {/* Text file badge (non-image) */}
                {msg.fileName && !msg.fileImagePreview && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--mu2)] justify-end">
                    <FileText size={11} />
                    <span>{msg.fileName}</span>
                  </div>
                )}
                <div className="bg-[var(--sur2)] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed text-[var(--fg)]">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="max-w-[90%]">
                {/* Badges IA */}
                {msg.selectedAIs && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {msg.selectedAIs.map((p) => {
                      const model = AI_MODELS.find((m) => m.provider === p)
                      return (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-md text-[var(--mu3)] bg-[var(--sur2)]">
                          {model?.name ?? p}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Alerte de divergence */}
                {msg.divergence && msg.divergence !== 'faible' && (
                  <div className={`flex items-start gap-2 mb-2 px-3 py-2 rounded-xl text-xs border ${
                    msg.divergence === 'élevé'
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                      : 'bg-yellow-500/8 border-yellow-500/20 text-yellow-500'
                  }`}>
                    <span className="text-base leading-none mt-0.5">
                      {msg.divergence === 'élevé' ? '⚠️' : '💬'}
                    </span>
                    <div>
                      <p className="font-medium">
                        {msg.divergence === 'élevé'
                          ? 'Les IA ne sont pas d\'accord'
                          : 'Les IA ont des approches différentes'}
                      </p>
                      <p className="opacity-75 mt-0.5">
                        {msg.divergenceReason || (msg.divergence === 'élevé'
                          ? 'Les conclusions divergent significativement — consultez les réponses individuelles.'
                          : 'Nuances notables entre les réponses — la synthèse présente le consensus.')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Débat */}
                {msg.debateData && !msg.isStreaming && (
                  <DebateView
                    debate={msg.debateData.debate}
                    verdict={msg.debateData.verdict}
                    question={messages.find((m, i) => messages[i + 1]?.id === msg.id)?.content ?? ''}
                  />
                )}

                {/* Réponse */}
                {(!msg.debateData || msg.isStreaming) && (
                <div className="py-1">
                  <MarkdownMessage content={msg.content} isStreaming={msg.isStreaming} />
                  {!msg.isStreaming && (
                    <div className="mt-3 pt-3 border-t border-[var(--sur2)] flex items-center gap-2">
                      {(() => {
                        const validCount = msg.aiResponses?.filter((r) => !r.error && r.content).length ?? 0
                        const src = msg.sourceAI as AIProvider | undefined
                        const model = src ? AI_MODELS.find((m) => m.provider === src) : undefined
                        if (!model) return null
                        const isBest = validCount > 1
                        return (
                          <span
                            className="flex items-center gap-1.5 text-[11px] text-[var(--mu3)]"
                            title={isBest ? `Meilleure réponse, choisie par l'arbitre parmi ${validCount} réponses` : `Réponse de ${model.name}`}
                          >
                            <span>{isBest ? '🏆' : '✨'}</span>
                            <span>{isBest ? 'Meilleure réponse' : 'Réponse'} ·</span>
                            <span className="flex items-center gap-1 font-medium" style={{ color: model.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: model.color }} />
                              {model.name}
                            </span>
                          </span>
                        )
                      })()}
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content)
                            setCopiedMsgId(msg.id)
                            setTimeout(() => setCopiedMsgId(null), 2000)
                          }}
                          className="p-1.5 rounded-lg text-[var(--mu3)] hover:text-[var(--mu1)] hover:bg-[var(--sur2)] transition-colors"
                          title="Copier"
                        >
                          {copiedMsgId === msg.id ? <Check size={13} className="text-[#cf7d56]" /> : <Copy size={13} />}
                        </button>
                        {msg.sourceAI && (
                          <FeedbackButtons
                            provider={msg.sourceAI as AIProvider}
                            category={msg.category ?? 'general'}
                            isFinalResponse
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                )}

                {/* Actions sous la réponse */}
                <div className="mt-2 flex items-center gap-3">
                  {/* Régénérer — seulement sur le dernier message assistant */}
                  {!msg.isStreaming && index === lastAssistantIndex && (
                    <button
                      onClick={handleRegenerate}
                      disabled={loading}
                      className="flex items-center gap-1.5 text-xs text-[var(--mu2)] hover:text-[var(--mu1)] transition-colors disabled:opacity-40"
                    >
                      <RotateCcw size={12} />
                      Régénérer
                    </button>
                  )}

                  {/* Comparer / Côte à côte */}
                  {!msg.isStreaming && msg.aiResponses && msg.aiResponses.length > 1 && (
                    <>
                      <button
                        onClick={() => toggleComparison(msg.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${showComparison[msg.id] ? 'text-[#cf7d56]' : 'text-[var(--mu2)] hover:text-[var(--mu1)]'}`}
                      >
                        <TableIcon size={12} />
                        Tableau
                        {showComparison[msg.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      <button
                        onClick={() => toggleSideBySide(msg.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${showSideBySide[msg.id] ? 'text-[#cf7d56]' : 'text-[var(--mu2)] hover:text-[var(--mu1)]'}`}
                      >
                        <Columns2 size={12} />
                        Côte à côte
                      </button>
                    </>
                  )}
                </div>

                {/* Sources web */}
                {!msg.isStreaming && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--sur2)] flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[10px] text-[var(--mu3)] flex items-center gap-1 shrink-0">
                      <Globe size={10} /> Sources
                    </span>
                    {msg.sources.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-[var(--mu3)] hover:text-[#cf7d56] transition-colors truncate max-w-[180px]"
                        title={s.title}
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}

                {/* Traduction */}
                {!msg.isStreaming && msg.content && !msg.debateData && (
                  <div className="mt-2">
                    <TranslateButton text={msg.content} />
                  </div>
                )}

                {/* Live comparison pendant le streaming */}
                {msg.isStreaming && index === lastAssistantIndex && (liveAiResponses.length > 0 || pendingAIs.length > 0) && (
                  <div className="mt-3">
                    <ComparisonTable
                      responses={liveAiResponses}
                      pendingProviders={pendingAIs}
                      arbitratorAI={null}
                      category={msg.category ?? 'general'}
                    />
                  </div>
                )}

                {/* Suggestions de suivi */}
                {!msg.isStreaming && index === lastAssistantIndex && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendQuestion(s)}
                        disabled={loading}
                        className="text-xs px-3 py-1.5 rounded-full border border-[var(--bdr)] bg-[var(--surface)] text-[var(--mu1)] hover:border-[#cf7d56] hover:text-[#e8a07a] transition-colors text-left disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {showComparison[msg.id] && msg.aiResponses && (
                  <ComparisonTable
                    responses={msg.aiResponses}
                    arbitratorAI={msg.arbitratorAI ?? null}
                    category={msg.category ?? 'general'}
                  />
                )}

                {showSideBySide[msg.id] && msg.aiResponses && (
                  <SideBySideView
                    responses={msg.aiResponses}
                    category={msg.category ?? 'general'}
                  />
                )}
              </div>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Limite atteinte */}
      {limitReached && (
        <div className="mx-4 mb-4 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-400">Crédits épuisés</p>
            <p className="text-xs text-[var(--mu1)] mt-1">
              {error || 'Vous avez utilisé tous vos crédits ce mois-ci.'}
            </p>
            <a href="/pricing"
              className="inline-block mt-2 text-xs bg-[#cf7d56] hover:bg-[#b86a43] text-white px-3 py-1.5 rounded-lg transition-colors">
              Voir les plans →
            </a>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && !limitReached && (
        <div className="mx-4 mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Bannière mode débat */}
      {isDebateMode && (
        <div className="mx-4 mb-1 flex items-center gap-3 bg-[var(--sur2)] border border-[#f97316]/25 rounded-xl px-3 py-2">
          <span className="text-base shrink-0">⚔️</span>
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-semibold text-[#f97316]">Mode Débat</span>
            {selectedAIs[0] && (() => {
              const m = AI_MODELS.find((x) => x.provider === selectedAIs[0])
              return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">✅ POUR · {m?.name}</span>
            })()}
            {selectedAIs[1] && (() => {
              const m = AI_MODELS.find((x) => x.provider === selectedAIs[1])
              return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">❌ CONTRE · {m?.name}</span>
            })()}
            {selectedAIs[2] && (() => {
              const m = AI_MODELS.find((x) => x.provider === selectedAIs[2])
              return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cf7d56]/10 border border-[#cf7d56]/20 text-[#e8a07a]">⚖️ ARBITRE · {m?.name}</span>
            })()}
          </div>
          <button onClick={() => setIsDebateMode(false)} className="text-[var(--mu3)] hover:text-[#f97316] transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Templates panel */}
      {showTemplates && (
        <div className="mx-4 mb-1">
          <PromptTemplates
            onSelect={(t) => { setInput(t); setShowTemplates(false); textareaRef.current?.focus() }}
            onClose={() => setShowTemplates(false)}
          />
        </div>
      )}

      {/* Zone de saisie */}
      <div className={`relative border-t bg-[var(--bg)] p-4 space-y-3 ${isDebateMode ? 'border-[#f97316]/30' : 'border-[var(--sur2)]'}`}>
        {showSelector && (
          <AISelector
            selectedAIs={selectedAIs}
            onToggle={toggleAI}
            category={category}
            onCategoryChange={handleCategoryChange}
            allowedAIs={allowedAIs}
            maxAIs={maxAIs}
          />
        )}

        {/* Personas */}
        {showPersonas && (
          <PersonaSelector
            activePersonaId={activePersonaId}
            onSelect={handlePersonaSelect}
            onClose={() => setShowPersonas(false)}
          />
        )}

        {/* Prompt personnalisé */}
        {showCustomPrompt && (
          <div className="rounded-xl border border-[var(--bdr)] bg-[var(--surface)] p-3 space-y-2">
            <p className="text-xs text-[var(--mu2)] font-medium">Instructions personnalisées</p>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ex : Réponds toujours avec des exemples de code. Sois concis."
              rows={3}
              className="w-full bg-transparent text-sm text-[#e4e4e7] placeholder:text-[var(--mu3)] resize-none focus:outline-none leading-relaxed"
            />
          </div>
        )}

        {/* Fichier joint */}
        {attachedFile && (
          <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--sur2)] rounded-lg px-3 py-2">
            {attachedFile.kind === 'image' ? (
              <>
                <img src={attachedFile.preview} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                <span className="text-xs text-[var(--mu1)] flex-1 truncate">{attachedFile.name}</span>
                <span className="text-[10px] text-[#cf7d56] bg-[#cf7d56]/10 px-1.5 py-0.5 rounded shrink-0">Vision</span>
              </>
            ) : (
              <>
                <FileText size={13} className="text-[#cf7d56] shrink-0" />
                <span className="text-xs text-[var(--mu1)] flex-1 truncate">{attachedFile.name}</span>
                <span className="text-[10px] text-[var(--mu3)] shrink-0">
                  {attachedFile.name.endsWith('.pdf') ? 'PDF' : 'Texte'}
                </span>
              </>
            )}
            <button onClick={() => setAttachedFile(null)} className="text-[var(--mu3)] hover:text-white transition-colors ml-1">
              <X size={13} />
            </button>
          </div>
        )}

        {/* URL détectée → résumé */}
        {(() => {
          const url = /^https?:\/\/\S+$/.exec(input.trim())?.[0]
          if (!url) return null
          return (
            <button
              onClick={() => handleSummarize(url)}
              disabled={summaryLoading || loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--bdr)] bg-[var(--surface)] text-xs text-[var(--mu2)] hover:border-[#cf7d56] hover:text-[#e8a07a] transition-colors disabled:opacity-40"
            >
              <Link size={12} />
              {summaryLoading ? 'Résumé en cours…' : 'Résumer cette URL'}
            </button>
          )
        })()}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {/* Outils — rangée dédiée sur mobile, en ligne sur desktop */}
          <div className="flex items-center gap-2">
          {/* Upload fichier */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.html,.css,.xml,.yaml,.yml,.sh,.sql"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || limitReached}
            title="Joindre un fichier"
            className={`p-2.5 rounded-lg border transition-colors shrink-0 disabled:opacity-40 ${
              attachedFile
                ? 'border-[#cf7d56]/40 text-[#cf7d56] bg-[#cf7d56]/10'
                : 'border-[var(--bdr)] text-[var(--mu3)] hover:text-[var(--mu1)] hover:border-[var(--mu3)] bg-[var(--surface)]'
            }`}
          >
            <Paperclip size={15} />
          </button>

          {/* Personas */}
          <button
            onClick={() => setShowPersonas((v) => !v)}
            title="Personas / Rôles"
            className={`p-2.5 rounded-xl border transition-all duration-200 shrink-0 ${
              activePersonaId
                ? 'border-[#cf7d56]/40 text-[#cf7d56] bg-[#cf7d56]/10'
                : 'border-[var(--bdr)] text-[var(--mu3)] hover:text-[var(--mu1)] hover:border-[var(--mu3)] bg-[var(--surface)]'
            }`}
          >
            {activePersonaId
              ? <span className="text-sm leading-none">{PERSONAS.find(p => p.id === activePersonaId)?.icon ?? '🎭'}</span>
              : <Wand2 size={15} />
            }
          </button>

          {/* Prompt perso toggle */}
          <button
            onClick={() => setShowCustomPrompt((v) => !v)}
            title="Instructions personnalisées"
            className={`p-2.5 rounded-xl border transition-all duration-200 shrink-0 ${
              showCustomPrompt || customPrompt.trim()
                ? 'border-[#cf7d56]/40 text-[#cf7d56] bg-[#cf7d56]/10'
                : 'border-[var(--bdr)] text-[var(--mu3)] hover:text-[var(--mu1)] hover:border-[var(--mu3)] bg-[var(--surface)]'
            }`}
          >
            <Settings2 size={15} />
          </button>

          {/* Templates */}
          <button
            onClick={() => setShowTemplates((v) => !v)}
            title="Modèles de prompts"
            className={`p-2.5 rounded-xl border transition-all duration-200 shrink-0 ${
              showTemplates
                ? 'border-[#cf7d56]/40 text-[#cf7d56] bg-[#cf7d56]/10'
                : 'border-[var(--bdr)] text-[var(--mu3)] hover:text-[var(--mu1)] hover:border-[var(--mu3)] bg-[var(--surface)]'
            }`}
          >
            <LayoutTemplate size={15} />
          </button>

          {/* Mode débat */}
          <button
            onClick={() => setIsDebateMode((v) => !v)}
            title="Mode débat — deux IA s'affrontent"
            className={`p-2.5 rounded-xl border transition-all duration-200 shrink-0 ${
              isDebateMode
                ? 'border-[#f97316]/50 text-[#f97316] bg-[#f97316]/10'
                : 'border-[var(--bdr)] text-[var(--mu3)] hover:text-[var(--mu1)] hover:border-[var(--mu3)] bg-[var(--surface)]'
            }`}
          >
            <Swords size={15} />
          </button>
          </div>

          {/* Saisie + envoi — pleine largeur sur mobile */}
          <div className="flex items-end gap-2 sm:flex-1">
          {/* Textarea */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || limitReached}
              placeholder={isDebateMode ? 'Sujet à débattre entre les IA…' : 'Posez votre question…'}
              rows={1}
              className={`w-full bg-[var(--surface)] border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors placeholder:text-[var(--mu3)] text-[var(--fg)] disabled:opacity-50 max-h-40 ${
                isDebateMode
                  ? 'border-[#f97316]/30 focus:border-[#f97316]/50'
                  : 'border-[var(--bdr)] focus:border-[var(--mu3)]'
              }`}
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
          </div>

          {/* Envoyer */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || debateLoading || selectedAIs.length === 0 || limitReached}
            className={`w-10 h-10 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0 ${
              isDebateMode ? 'bg-[#f97316] hover:bg-[#ea6c0a]' : 'bg-[#cf7d56] hover:bg-[#b86a43]'
            }`}
          >
            {isDebateMode ? <Swords size={16} /> : <Send size={16} />}
          </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-[var(--mu1)]">Chargement...</div>}>
      <ChatContent />
    </Suspense>
  )
}
