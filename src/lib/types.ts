export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'perplexity' | 'grok' | 'deepseek' | 'groq'

export type Category =
  | 'general'
  | 'code'
  | 'creative'
  | 'research'
  | 'math'
  | 'multilingual'
  | 'summarize'

export interface AIModel {
  provider: AIProvider
  name: string
  model: string
  description: string
  strengths: Category[]
  color: string
}

export interface AIResponse {
  provider: AIProvider
  content: string
  error?: string
  durationMs?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  aiResponses?: AIResponse[]
  selectedAIs?: AIProvider[]
  arbitratorAI?: AIProvider
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface UserAPIKey {
  provider: AIProvider
  connected: boolean
}

export const AI_MODELS: AIModel[] = [
  {
    provider: 'openai',
    name: 'GPT-4o',
    model: 'gpt-4o',
    description: 'Modèle phare d\'OpenAI, excellent en tout',
    strengths: ['general', 'code', 'math', 'multilingual'],
    color: '#10a37f',
  },
  {
    provider: 'anthropic',
    name: 'Claude',
    model: 'claude-sonnet-4-6',
    description: 'Excellent en raisonnement, code et rédaction',
    strengths: ['code', 'creative', 'research', 'summarize'],
    color: '#d4a853',
  },
  {
    provider: 'gemini',
    name: 'Gemini',
    model: 'gemini-2.0-flash',
    description: 'Rapide et multimodal, excellente fenêtre de contexte',
    strengths: ['research', 'summarize', 'multilingual', 'general'],
    color: '#4285f4',
  },
  {
    provider: 'mistral',
    name: 'Mistral',
    model: 'mistral-large-latest',
    description: 'Excellent en français et multilingue',
    strengths: ['multilingual', 'creative', 'general'],
    color: '#ff7000',
  },
  {
    provider: 'perplexity',
    name: 'Perplexity',
    model: 'sonar-pro',
    description: 'Accès web en temps réel, idéal pour la recherche',
    strengths: ['research', 'general'],
    color: '#20b2aa',
  },
  {
    provider: 'grok',
    name: 'Grok',
    model: 'grok-3',
    description: 'IA de xAI, forte en raisonnement et actualité',
    strengths: ['general', 'research', 'math'],
    color: '#ff4444',
  },
  {
    provider: 'deepseek',
    name: 'DeepSeek',
    model: 'deepseek-chat',
    description: 'Modèle chinois open-source, excellent en code et maths',
    strengths: ['code', 'math', 'general'],
    color: '#6c5ce7',
  },
  {
    provider: 'groq',
    name: 'Llama',
    model: 'llama-3.3-70b-versatile',
    description: 'Llama 3.3 70B par Meta via Groq — open-source, ultra rapide',
    strengths: ['general', 'code', 'multilingual'],
    color: '#0064e0',
  },
]

export const CATEGORY_LABELS: Record<Category, string> = {
  general: 'Général',
  code: 'Code / Dev',
  creative: 'Créativité / Rédaction',
  research: 'Recherche',
  math: 'Maths / Logique',
  multilingual: 'Multilangue',
  summarize: 'Résumé / Analyse',
}

export const RECOMMENDED_AIS: Record<Category, AIProvider[]> = {
  general: ['openai', 'anthropic', 'groq'],
  code: ['anthropic', 'deepseek', 'groq'],
  creative: ['anthropic', 'openai', 'mistral'],
  research: ['perplexity', 'grok', 'gemini'],
  math: ['deepseek', 'openai', 'anthropic'],
  multilingual: ['mistral', 'groq', 'gemini'],
  summarize: ['anthropic', 'gemini', 'openai'],
}

// ─── Image Generation ────────────────────────────────────────────────────────

export type ImageProvider = 'dalle' | 'stability' | 'flux' | 'ideogram' | 'gptimage'

export interface ImageModelInfo {
  provider: ImageProvider
  name: string
  description: string
  color: string
}

export interface GeneratedImage {
  provider: ImageProvider
  url?: string
  historyUrl?: string  // URL permanente pour l'historique (quand url est base64)
  error?: string
  durationMs?: number
}

export const IMAGE_MODELS: ImageModelInfo[] = [
  { provider: 'dalle',     name: 'Pollinations',          description: 'Flux via Pollinations — gratuit & rapide',   color: '#10a37f' },
  { provider: 'stability', name: 'Stable Diffusion 3.5', description: 'Stability AI — art & illustrations',         color: '#7c3aed' },
  { provider: 'flux',      name: 'Flux 1.1 Pro',         description: 'Black Forest Labs — ultra réaliste',         color: '#2563eb' },
  { provider: 'ideogram',  name: 'Ideogram 2',           description: 'Meilleur pour le texte dans les images',     color: '#db2777' },
  { provider: 'gptimage',  name: 'ChatGPT Image',         description: 'OpenAI gpt-image-1 — cohérence & texte',     color: '#10a37f' },
]

// ─── Video Generation ─────────────────────────────────────────────────────────

export type VideoProvider = 'runway' | 'luma' | 'kling' | 'pika' | 'minimax'

export interface VideoModelInfo {
  provider: VideoProvider
  name: string
  description: string
  color: string
}

export interface GeneratedVideo {
  provider: VideoProvider
  url?: string
  thumbnailUrl?: string
  error?: string
  durationMs?: number
}

export const VIDEO_MODELS: VideoModelInfo[] = [
  { provider: 'runway',  name: 'Runway Gen-3',        description: 'Cinématique, mouvements fluides, qualité pro', color: '#0ea5e9' },
  { provider: 'luma',    name: 'Luma Dream Machine',  description: 'Réalisme physique exceptionnel',               color: '#8b5cf6' },
  { provider: 'kling',   name: 'Kling 1.6',           description: 'Cohérence temporelle, sujets multiples',       color: '#f59e0b' },
  { provider: 'pika',    name: 'Pika 2.0',            description: 'Effets créatifs & transitions',                color: '#ec4899' },
  { provider: 'minimax', name: 'Hailuo / MiniMax',    description: 'Rapide, économique, bon niveau général',       color: '#10b981' },
]

// ─── Modèle D : plans & quotas ───────────────────────────────────────────────
export type UserPlan = 'visitor' | 'free' | 'starter' | 'pro' | 'unlimited' | 'dev'

export type PlanConfig = {
  credits: number        // crédits/mois (Infinity = illimité)
  maxAIs: number         // nb max d'IA simultanées
  allowedAIs: AIProvider[]
  label: string
  price: string
}

// Conversion : 1 crédit = 1 500 tokens en moyenne
export const TOKENS_PER_CREDIT = 1500

export function creditsToTokens(credits: number): string {
  if (credits === Infinity) return '∞'
  const total = credits * TOKENS_PER_CREDIT
  if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (total >= 1_000) return `${Math.round(total / 1_000)}K`
  return total.toLocaleString('fr-FR')
}

export const PLANS: Record<UserPlan, PlanConfig> = {
  visitor: {
    credits: 6,
    maxAIs: 2,
    allowedAIs: ['gemini', 'mistral', 'deepseek', 'groq'],
    label: 'Visiteur',
    price: '0€',
  },
  free: {
    credits: 100,
    maxAIs: 2,
    allowedAIs: ['gemini', 'mistral', 'deepseek', 'groq'],
    label: 'Gratuit',
    price: '0€',
  },
  starter: {
    credits: 300,
    maxAIs: 4,
    allowedAIs: ['gemini', 'mistral', 'deepseek', 'groq', 'openai', 'perplexity'],
    label: 'Starter',
    price: '4,99€',
  },
  pro: {
    credits: 1000,
    maxAIs: 6,
    allowedAIs: ['gemini', 'mistral', 'deepseek', 'groq', 'openai', 'perplexity', 'grok', 'anthropic'],
    label: 'Pro',
    price: '9,99€',
  },
  unlimited: {
    credits: Infinity,
    maxAIs: 8,
    allowedAIs: ['gemini', 'mistral', 'deepseek', 'groq', 'openai', 'perplexity', 'grok', 'anthropic'],
    label: 'Illimité',
    price: '19,99€',
  },
  dev: {
    credits: Infinity,
    maxAIs: 8,
    allowedAIs: ['gemini', 'mistral', 'deepseek', 'groq', 'openai', 'perplexity', 'grok', 'anthropic'],
    label: 'Dev',
    price: '0€',
  },
}

// Rétrocompat
export const VISITOR_LIFETIME_LIMIT = PLANS.visitor.credits
export const FREE_MONTHLY_LIMIT = PLANS.free.credits
