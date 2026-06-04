import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Mistral } from '@mistralai/mistralai'
import { tavily } from '@tavily/core'
import { AIProvider, AIResponse, AI_MODELS } from '@/lib/types'

type HistoryMessage = { role: 'user' | 'assistant'; content: string }

export type ImageAttachment = {
  base64: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
}

const BASE_SYSTEM_PROMPT = `Tu es un assistant IA expert et polyvalent. Réponds toujours en français sauf demande contraire.

Quand ta réponse bénéficierait d'une illustration visuelle (géométrie, schémas, graphes, arbres, diagrammes, architectures, processus...), inclus-la dans ta réponse :

- Pour les formes géométriques, figures mathématiques, icônes simples → utilise un bloc \`\`\`svg avec du SVG valide (viewBox="0 0 200 200" SANS attributs width/height fixes, couleurs claires sur fond transparent)
- Pour les flowcharts, diagrammes de séquence, mind maps, graphes → utilise un bloc \`\`\`mermaid (IMPORTANT : utilise uniquement des caractères ASCII dans les labels Mermaid — pas d'accents, pas d'apostrophes, pas de caractères spéciaux)

N'inclus un diagramme que s'il apporte une réelle valeur pédagogique. Ne génère pas d'image pour les questions purement textuelles.`

export type WebSource = { title: string; url: string }

export type DivergenceLevel = 'faible' | 'modéré' | 'élevé'

export type DebateResponse = { role: 'pour' | 'contre'; provider: AIProvider; content: string; durationMs?: number }

export type StreamEvent =
  | { type: 'ai_result'; response: AIResponse }
  | { type: 'token'; text: string }
  | { type: 'complete'; aiResponses: AIResponse[]; arbitratorAI: AIProvider | null; sourceAI: AIProvider | null; bestResponse: string; sources: WebSource[]; divergence: DivergenceLevel; divergenceReason: string }
  | { type: 'debate_complete'; debate: DebateResponse[]; verdict?: string }

function getPlatformKeys(): Record<AIProvider, string | undefined> {
  return {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY,
    grok: process.env.GROK_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    groq: process.env.GROQ_API_KEY,
  }
}

async function searchWeb(question: string): Promise<{ context: string; sources: WebSource[] }> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return { context: '', sources: [] }
  try {
    const client = tavily({ apiKey })
    const result = await client.search(question, { maxResults: 5, searchDepth: 'advanced' })
    if (!result.results?.length) return { context: '', sources: [] }
    const sources: WebSource[] = result.results.map((r: { title: string; url: string }) => ({ title: r.title, url: r.url }))
    const context = result.results
      .map((r: { title: string; content: string; url: string }) => `[${r.title}]\n${r.content}\nSource: ${r.url}`)
      .join('\n\n')
    return { context: `\n\n--- Informations web récentes ---\n${context}\n--- Fin des informations web ---\n`, sources }
  } catch {
    return { context: '', sources: [] }
  }
}

// Recontextualise la requête de recherche web.
// Un message de suivi court ("voiture" après "améliore l'autonomie de ma batterie")
// est ambigu seul → Tavily ramènerait des sources hors-sujet qui détournent les IA.
// On le préfixe avec le dernier message utilisateur pour garder la recherche dans le fil.
function buildSearchQuery(question: string, history: HistoryMessage[]): string {
  const trimmed = question.trim()
  if (history.length === 0 || trimmed.length > 80) return trimmed
  const lastUser = [...history].reverse().find((m) => m.role === 'user')?.content?.trim() ?? ''
  return lastUser ? `${lastUser} ${trimmed}`.slice(0, 400) : trimmed
}

async function callOpenAI(
  apiKey: string,
  question: string,
  history: HistoryMessage[],
  systemPrompt: string,
  image?: ImageAttachment,
): Promise<AIResponse> {
  const start = Date.now()
  try {
    const client = new OpenAI({ apiKey })

    type ContentPart =
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }

    const userContent: string | ContentPart[] = image
      ? [
          { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
          { type: 'text', text: question },
        ]
      : question

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userContent as string },
      ],
      max_tokens: 2000,
    })
    return { provider: 'openai', content: response.choices[0].message.content ?? '', durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { provider: 'openai', content: '', error: (e as Error).message, durationMs: Date.now() - start }
  }
}

async function callAnthropic(
  apiKey: string,
  question: string,
  history: HistoryMessage[],
  systemPrompt: string,
  image?: ImageAttachment,
): Promise<AIResponse> {
  const start = Date.now()
  try {
    const client = new Anthropic({ apiKey })

    type AnthropicContent =
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: ImageAttachment['mimeType']; data: string } }

    const userContent: string | AnthropicContent[] = image
      ? [
          { type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.base64 } },
          { type: 'text', text: question },
        ]
      : question

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: userContent as string },
      ],
    })
    const text = response.content.find((b) => b.type === 'text')?.text ?? ''
    return { provider: 'anthropic', content: text, durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { provider: 'anthropic', content: '', error: (e as Error).message, durationMs: Date.now() - start }
  }
}

async function callGemini(
  apiKey: string,
  question: string,
  history: HistoryMessage[],
  systemPrompt: string,
  image?: ImageAttachment,
): Promise<AIResponse> {
  const start = Date.now()
  try {
    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction: systemPrompt })

    if (image) {
      // With image, use generateContent directly (includes history as text)
      const contents = [
        ...history.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        {
          role: 'user',
          parts: [
            { inlineData: { data: image.base64, mimeType: image.mimeType } },
            { text: question },
          ],
        },
      ]
      const result = await model.generateContent({ contents })
      return { provider: 'gemini', content: result.response.text(), durationMs: Date.now() - start }
    }

    const chat = model.startChat({
      history: history.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    })
    const result = await chat.sendMessage(question)
    return { provider: 'gemini', content: result.response.text(), durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { provider: 'gemini', content: '', error: (e as Error).message, durationMs: Date.now() - start }
  }
}

async function callMistral(
  apiKey: string,
  question: string,
  history: HistoryMessage[],
  systemPrompt: string,
  image?: ImageAttachment,
): Promise<AIResponse> {
  const start = Date.now()
  try {
    const client = new Mistral({ apiKey })
    const effectiveQuestion = image
      ? `[Image jointe — Mistral Large ne supporte pas encore la vision, description textuelle uniquement]\n\n${question}`
      : question
    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: effectiveQuestion },
      ],
    })
    const content = response.choices?.[0]?.message?.content ?? ''
    return { provider: 'mistral', content: typeof content === 'string' ? content : '', durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { provider: 'mistral', content: '', error: (e as Error).message, durationMs: Date.now() - start }
  }
}

async function callPerplexity(
  apiKey: string,
  question: string,
  history: HistoryMessage[],
  systemPrompt: string,
  image?: ImageAttachment,
): Promise<AIResponse> {
  const start = Date.now()
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.perplexity.ai' })
    const effectiveQuestion = image
      ? `[Image jointe — Perplexity ne supporte pas encore la vision]\n\n${question}`
      : question
    const response = await client.chat.completions.create({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: effectiveQuestion },
      ],
      max_tokens: 2000,
    })
    return { provider: 'perplexity', content: response.choices[0].message.content ?? '', durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { provider: 'perplexity', content: '', error: (e as Error).message, durationMs: Date.now() - start }
  }
}

async function callGrok(
  apiKey: string,
  question: string,
  history: HistoryMessage[],
  systemPrompt: string,
  image?: ImageAttachment,
): Promise<AIResponse> {
  const start = Date.now()
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.x.ai/v1' })
    const model = image ? 'grok-2-vision-1212' : 'grok-3'

    type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
    const userContent: string | ContentPart[] = image
      ? [
          { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
          { type: 'text', text: question },
        ]
      : question

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userContent as string },
      ],
      max_tokens: 2000,
    })
    return { provider: 'grok', content: response.choices[0].message.content ?? '', durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { provider: 'grok', content: '', error: (e as Error).message, durationMs: Date.now() - start }
  }
}

async function callGroq(
  apiKey: string,
  question: string,
  history: HistoryMessage[],
  systemPrompt: string,
  image?: ImageAttachment,
): Promise<AIResponse> {
  const start = Date.now()
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' })
    const effectiveQuestion = image
      ? `[Image jointe — Llama ne supporte pas encore la vision]\n\n${question}`
      : question
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: effectiveQuestion },
      ],
      max_tokens: 2000,
    })
    return { provider: 'groq', content: response.choices[0].message.content ?? '', durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { provider: 'groq', content: '', error: (e as Error).message, durationMs: Date.now() - start }
  }
}

async function callDeepSeek(
  apiKey: string,
  question: string,
  history: HistoryMessage[],
  systemPrompt: string,
  image?: ImageAttachment,
): Promise<AIResponse> {
  const start = Date.now()
  try {
    const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' })
    const effectiveQuestion = image
      ? `[Image jointe — DeepSeek ne supporte pas encore la vision]\n\n${question}`
      : question
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: effectiveQuestion },
      ],
      max_tokens: 2000,
    })
    return { provider: 'deepseek', content: response.choices[0].message.content ?? '', durationMs: Date.now() - start }
  } catch (e: unknown) {
    return { provider: 'deepseek', content: '', error: (e as Error).message, durationMs: Date.now() - start }
  }
}

async function callAI(
  provider: AIProvider,
  apiKey: string,
  question: string,
  history: HistoryMessage[],
  systemPrompt: string,
  image?: ImageAttachment,
): Promise<AIResponse> {
  switch (provider) {
    case 'openai':     return callOpenAI(apiKey, question, history, systemPrompt, image)
    case 'anthropic':  return callAnthropic(apiKey, question, history, systemPrompt, image)
    case 'gemini':     return callGemini(apiKey, question, history, systemPrompt, image)
    case 'mistral':    return callMistral(apiKey, question, history, systemPrompt, image)
    case 'perplexity': return callPerplexity(apiKey, question, history, systemPrompt, image)
    case 'grok':       return callGrok(apiKey, question, history, systemPrompt, image)
    case 'deepseek':   return callDeepSeek(apiKey, question, history, systemPrompt, image)
    case 'groq':       return callGroq(apiKey, question, history, systemPrompt, image)
  }
}

function pickArbitrator(selectedProviders: AIProvider[], allKeys: Record<AIProvider, string | undefined>): AIProvider | null {
  const preferred: AIProvider[] = ['anthropic', 'openai', 'gemini', 'grok', 'mistral', 'perplexity', 'deepseek', 'groq']
  return preferred.find((p) => !selectedProviders.includes(p) && allKeys[p]) ?? null
}

async function analyzeDivergence(
  question: string,
  responses: AIResponse[],
  platformKeys: Record<AIProvider, string | undefined>,
): Promise<{ level: DivergenceLevel; reason: string }> {
  if (responses.length < 2) return { level: 'faible', reason: '' }

  const prompt = `Tu analyses les conclusions de plusieurs IAs ayant répondu à la même question.

Question : "${question}"

${responses.map((r, i) => `--- IA ${i + 1} (${AI_MODELS.find((m) => m.provider === r.provider)?.name ?? r.provider}) ---\n${r.content.slice(0, 600)}`).join('\n\n')}

Extrais la conclusion principale de chaque réponse (1 phrase), puis évalue si elles convergent.

Réponds UNIQUEMENT en JSON valide sans markdown :
{"conclusions":["conclusion 1","conclusion 2"],"divergence":"faible","raison":"explication"}

Règles strictes :
- "faible" : toutes arrivent à la même conclusion ou des conclusions compatibles
- "modéré" : même direction générale mais nuances ou priorités différentes
- "élevé" : conclusions contradictoires, incompatibles ou radicalement différentes`

  // Utiliser le provider le moins cher disponible
  const order: AIProvider[] = ['groq', 'deepseek', 'mistral', 'gemini', 'openai', 'anthropic', 'grok', 'perplexity']
  const provider = order.find((p) => platformKeys[p])
  if (!provider) return { level: 'faible', reason: '' }

  try {
    let content = ''
    const key = platformKeys[provider]!

    if (provider === 'deepseek') {
      const client = new OpenAI({ apiKey: key, baseURL: 'https://api.deepseek.com' })
      const res = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
      })
      content = res.choices[0].message.content ?? ''
    } else if (provider === 'mistral') {
      const client = new Mistral({ apiKey: key })
      const res = await client.chat.complete({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
      })
      const c = res.choices?.[0]?.message?.content
      content = typeof c === 'string' ? c : ''
    } else if (provider === 'openai') {
      const client = new OpenAI({ apiKey: key })
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
      })
      content = res.choices[0].message.content ?? ''
    } else if (provider === 'anthropic') {
      const client = new Anthropic({ apiKey: key })
      const res = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      })
      content = res.content.find((b) => b.type === 'text')?.text ?? ''
    } else {
      const client = new OpenAI({ apiKey: key, baseURL: provider === 'grok' ? 'https://api.x.ai/v1' : 'https://api.perplexity.ai' })
      const res = await client.chat.completions.create({
        model: provider === 'grok' ? 'grok-3' : 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
      })
      content = res.choices[0].message.content ?? ''
    }

    const match = content.match(/\{[\s\S]*\}/)
    const json = JSON.parse(match?.[0] ?? content)
    const level: DivergenceLevel = ['faible', 'modéré', 'élevé'].includes(json.divergence)
      ? json.divergence
      : 'faible'
    return { level, reason: json.raison ?? '' }
  } catch {
    return { level: 'faible', reason: '' }
  }
}

// Appel LLM simple (non streamé), tous providers — utilisé pour le jugement de l'arbitre.
async function simpleCompletion(provider: AIProvider, apiKey: string, prompt: string, maxTokens = 10): Promise<string> {
  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey })
    const res = await client.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] })
    return res.content.find((b) => b.type === 'text')?.text ?? ''
  }
  if (provider === 'gemini') {
    const client = new GoogleGenerativeAI(apiKey)
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const res = await model.generateContent(prompt)
    return res.response.text()
  }
  if (provider === 'mistral') {
    const client = new Mistral({ apiKey })
    const res = await client.chat.complete({ model: 'mistral-small-latest', messages: [{ role: 'user', content: prompt }] })
    const c = res.choices?.[0]?.message?.content
    return typeof c === 'string' ? c : ''
  }
  const baseURL =
    provider === 'grok' ? 'https://api.x.ai/v1' :
    provider === 'perplexity' ? 'https://api.perplexity.ai' :
    provider === 'deepseek' ? 'https://api.deepseek.com' :
    provider === 'groq' ? 'https://api.groq.com/openai/v1' :
    undefined
  const model =
    provider === 'grok' ? 'grok-3' :
    provider === 'perplexity' ? 'sonar' :
    provider === 'deepseek' ? 'deepseek-chat' :
    provider === 'groq' ? 'llama-3.3-70b-versatile' :
    'gpt-4o-mini'
  const client = new OpenAI(baseURL ? { apiKey, baseURL } : { apiKey })
  const res = await client.chat.completions.create({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] })
  return res.choices[0].message.content ?? ''
}

// L'arbitre ÉLIT la meilleure réponse parmi celles des IA (aucune synthèse / réécriture).
// Renvoie l'index de la meilleure réponse, ou -1 si le jugement échoue.
async function pickBestIndex(
  question: string,
  validResponses: AIResponse[],
  provider: AIProvider,
  apiKey: string,
  history: HistoryMessage[],
): Promise<number> {
  const conversationContext = history.length > 0
    ? `Contexte récent de la conversation :\n${history.slice(-4).map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'} : ${m.content.slice(0, 300)}`).join('\n')}\n\n`
    : ''
  const prompt = `Plusieurs IA ont répondu à la même question. Choisis la MEILLEURE réponse : la plus complète, exacte, claire et utile.

${conversationContext}Question : "${question}"

${validResponses.map((r, i) => `--- Réponse ${i + 1} (${AI_MODELS.find((m) => m.provider === r.provider)?.name ?? r.provider}) ---\n${r.content.slice(0, 1500)}`).join('\n\n')}

Réponds UNIQUEMENT par le numéro (de 1 à ${validResponses.length}) de la meilleure réponse. Aucun autre mot.`
  try {
    const content = await simpleCompletion(provider, apiKey, prompt, 10)
    const match = content.match(/\d+/)
    const idx = match ? parseInt(match[0], 10) - 1 : -1
    return idx >= 0 && idx < validResponses.length ? idx : -1
  } catch {
    return -1
  }
}

async function* streamText(text: string): AsyncGenerator<string> {
  const chunkSize = 15
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize)
  }
}

export async function* streamDebate(
  question: string,
  selectedProviders: AIProvider[],
): AsyncGenerator<StreamEvent> {
  const platformKeys = getPlatformKeys()
  const available = selectedProviders.filter((p) => platformKeys[p])
  if (available.length < 2) {
    yield { type: 'debate_complete', debate: [] }
    return
  }

  const [providerPour, providerContre] = available
  const promptPour = `Tu participes à un débat. Tu dois défendre la position POUR sur le sujet suivant : "${question}"\n\nRègles :\n- Argumente exclusivement en faveur\n- Sois convainquant, cite des faits, exemples, données\n- Structure tes arguments clairement\n- Ne mentionne pas que tu joues un rôle`
  const promptContre = `Tu participes à un débat. Tu dois défendre la position CONTRE sur le sujet suivant : "${question}"\n\nRègles :\n- Argumente exclusivement contre\n- Sois convainquant, cite des faits, exemples, données\n- Structure tes arguments clairement\n- Ne mentionne pas que tu joues un rôle`

  const [resPour, resContre] = await Promise.all([
    callAI(providerPour, platformKeys[providerPour]!, promptPour, [], BASE_SYSTEM_PROMPT),
    callAI(providerContre, platformKeys[providerContre]!, promptContre, [], BASE_SYSTEM_PROMPT),
  ])

  const debate: DebateResponse[] = [
    { role: 'pour', provider: providerPour, content: resPour.content, durationMs: resPour.durationMs },
    { role: 'contre', provider: providerContre, content: resContre.content, durationMs: resContre.durationMs },
  ]

  // Verdict par un 3e arbitre si disponible
  let verdict: string | undefined
  const arbitrator = available.find((p) => p !== providerPour && p !== providerContre)
    ?? pickArbitrator([providerPour, providerContre], platformKeys)
  if (arbitrator && platformKeys[arbitrator]) {
    const verdictPrompt = `Tu arbitres un débat sur : "${question}"\n\nArguments POUR :\n${resPour.content}\n\nArguments CONTRE :\n${resContre.content}\n\nDonne un verdict équilibré en 3-5 phrases : quels arguments sont les plus solides, quelle position semble la plus défendable, et pourquoi.`
    const verdictRes = await callAI(arbitrator, platformKeys[arbitrator]!, verdictPrompt, [], BASE_SYSTEM_PROMPT)
    verdict = verdictRes.content
  }

  yield { type: 'debate_complete', debate, verdict }
}

export async function* streamOrchestrate(
  question: string,
  selectedProviders: AIProvider[],
  history: HistoryMessage[] = [],
  customPrompt?: string,
  fileContent?: string,
  image?: ImageAttachment,
): AsyncGenerator<StreamEvent> {
  const platformKeys = getPlatformKeys()
  const availableProviders = selectedProviders.filter((p) => platformKeys[p])

  if (availableProviders.length === 0) {
    yield { type: 'complete', aiResponses: [], arbitratorAI: null, sourceAI: null, bestResponse: 'Aucune IA disponible pour le moment.', sources: [], divergence: 'faible' as const, divergenceReason: '' }
    return
  }

  const systemPrompt = customPrompt
    ? `${BASE_SYSTEM_PROMPT}\n\n--- Instructions personnalisées ---\n${customPrompt}`
    : BASE_SYSTEM_PROMPT

  const questionWithFile = fileContent
    ? `${question}\n\n--- Fichier joint ---\n${fileContent}\n--- Fin du fichier ---`
    : question

  const searchQuery = buildSearchQuery(question, history)
  const { context: webContext, sources } = image ? { context: '', sources: [] } : await searchWeb(searchQuery)
  const enrichedQuestion = webContext
    ? `${questionWithFile}\n${webContext}\nRéponds à la question en te basant sur ces informations récentes si pertinent.`
    : questionWithFile

  const responses = await Promise.all(
    availableProviders.map((p) => callAI(p, platformKeys[p]!, enrichedQuestion, history, systemPrompt, image))
  )

  for (const r of responses) {
    if (r.error) console.error(`[${r.provider}] Erreur:`, r.error)
    else console.log(`[${r.provider}] OK (${r.durationMs}ms)`)
    yield { type: 'ai_result', response: r }
  }

  const valid = responses.filter((r) => !r.error && r.content)
  const arbitratorProvider = pickArbitrator(availableProviders, platformKeys)

  let bestResponse = ''
  let sourceAI: AIProvider | null = null

  if (valid.length === 0) {
    bestResponse = 'Aucune réponse disponible.'
    yield { type: 'token', text: bestResponse }
  } else if (valid.length === 1 || !arbitratorProvider) {
    const best = [...valid].sort((a, b) => b.content.length - a.content.length)[0]
    sourceAI = best.provider
    for await (const chunk of streamText(best.content)) {
      bestResponse += chunk
      yield { type: 'token', text: chunk }
    }
  } else {
    // L'arbitre élit la meilleure réponse parmi celles des IA ; on l'affiche telle quelle.
    const winnerIdx = await pickBestIndex(question, valid, arbitratorProvider, platformKeys[arbitratorProvider]!, history)
    const winner = winnerIdx >= 0 ? valid[winnerIdx] : [...valid].sort((a, b) => b.content.length - a.content.length)[0]
    sourceAI = winner.provider
    for await (const chunk of streamText(winner.content)) {
      bestResponse += chunk
      yield { type: 'token', text: chunk }
    }
  }

  const { level: divergence, reason: divergenceReason } = await analyzeDivergence(question, valid, platformKeys)
  yield { type: 'complete', aiResponses: responses, arbitratorAI: arbitratorProvider, sourceAI, bestResponse, sources, divergence, divergenceReason }
}
