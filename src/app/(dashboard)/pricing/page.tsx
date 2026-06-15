'use client'

import Link from 'next/link'
import { Check, Zap } from 'lucide-react'

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€',
    period: '',
    description: 'Pour découvrir la plateforme',
    tokens: '150K tokens / mois',
    maxAIs: '2 IA simultanées',
    features: [
      '150 000 tokens / mois',
      '2 IA simultanées max',
      'Gemini, Mistral, DeepSeek, Llama',
      'Historique des conversations',
      'Sources web (Tavily)',
    ],
    locked: ['GPT', 'Claude', 'Grok', 'Perplexity'],
    cta: 'Commencer gratuitement',
    href: '/register',
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '4,99€',
    period: '/ mois',
    description: 'Pour les utilisateurs réguliers',
    tokens: '450K tokens / mois',
    maxAIs: '4 IA simultanées',
    features: [
      '450 000 tokens / mois',
      '4 IA simultanées max',
      '+ GPT, Perplexity',
      'Toutes les catégories',
      'Mode débat',
    ],
    locked: ['Claude', 'Grok'],
    cta: 'Choisir Starter',
    href: '#',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9,99€',
    period: '/ mois',
    description: 'Pour les power users',
    tokens: '1,5M tokens / mois',
    maxAIs: '6 IA simultanées',
    features: [
      '1 500 000 tokens / mois',
      '6 IA simultanées max',
      '+ Claude, Grok',
      'Toutes les fonctionnalités',
      'Support prioritaire',
    ],
    locked: [],
    cta: 'Choisir Pro',
    href: '#',
    highlight: true,
  },
  {
    id: 'unlimited',
    name: 'Illimité',
    price: '19,99€',
    period: '/ mois',
    description: 'Sans aucune limite',
    tokens: 'Tokens illimités',
    maxAIs: '8 IA simultanées',
    features: [
      'Tokens illimités',
      '8 IA simultanées',
      'Toutes les IA disponibles',
      'Accès prioritaire aux nouveaux modèles',
      'Support dédié',
    ],
    locked: [],
    cta: 'Choisir Illimité',
    href: '#',
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">Choisissez votre plan</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl p-6 border flex flex-col gap-4 ${
              plan.highlight
                ? 'border-[#cf7d56] bg-[#cf7d56]/10'
                : 'border-[var(--sur2)] bg-[var(--surface)]'
            }`}
          >
            {plan.highlight && (
              <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-[#cf7d56]">
                <Zap size={12} /> Recommandé
              </span>
            )}

            <div>
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-[var(--mu1)] text-sm">{plan.period}</span>
              </div>
              <p className="text-[var(--mu1)] text-xs mt-1">{plan.description}</p>
            </div>

            {/* Quota badge */}
            <div className="bg-[var(--sur2)] rounded-xl px-3 py-2 text-center">
              <p className="text-sm font-semibold text-[var(--fg)]">{plan.tokens}</p>
              <p className="text-xs text-[var(--mu2)]">{plan.maxAIs}</p>
            </div>

            <ul className="space-y-2 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check size={14} className="text-[#cf7d56] mt-0.5 shrink-0" />
                  <span className="text-[var(--tx2)]">{feature}</span>
                </li>
              ))}
              {plan.locked.map((ia) => (
                <li key={ia} className="flex items-start gap-2 text-sm opacity-40">
                  <span className="mt-0.5 shrink-0 text-[var(--mu3)]">✕</span>
                  <span className="text-[var(--mu3)]">{ia}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`block w-full text-center py-2.5 rounded-xl font-medium text-sm transition-colors ${
                plan.highlight
                  ? 'bg-[#cf7d56] hover:bg-[#b86a43] text-white'
                  : 'border border-[var(--sur2)] hover:border-[#cf7d56] text-[var(--fg)]'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-[var(--mu3)] text-sm mt-10">
        Le paiement sera disponible prochainement. &nbsp;
        <Link href="/chat" className="text-[#cf7d56] hover:underline">
          Retour au chat
        </Link>
      </p>
    </div>
  )
}
