import Link from 'next/link'
import { AI_MODELS, CATEGORY_LABELS } from '@/lib/types'
import OrchLogo from '@/components/OrchLogo'

export default function HomePage() {
  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-[#27272a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <OrchLogo size={32} />
          <span className="font-semibold text-lg">orch<span className="text-[#cf7d56]">.AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#a1a1aa] hover:text-white transition-colors px-4 py-2">
            Connexion
          </Link>
          <Link href="/register" className="text-sm bg-[#cf7d56] hover:bg-[#b86a43] transition-colors px-4 py-2 rounded-lg font-medium text-white">
            Commencer gratuitement
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-full px-4 py-1.5 text-sm text-[#a1a1aa] mb-8">
          <span className="w-2 h-2 rounded-full bg-[#cf7d56] animate-pulse"></span>
          Comparez toutes les IA en un seul endroit
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight max-w-3xl leading-tight mb-6">
          Une question.{' '}
          <span className="text-[#cf7d56]">Toutes les IA.</span>{' '}
          La meilleure réponse.
        </h1>

        <p className="text-xl text-[#a1a1aa] max-w-2xl mb-10">
          Interrogez GPT, Claude, Gemini et Mistral simultanément. Une IA arbitre synthétise et sélectionne la meilleure réponse pour vous.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link
            href="/chat"
            className="bg-[#cf7d56] hover:bg-[#b86a43] transition-colors px-8 py-3.5 rounded-xl font-semibold text-lg text-white"
          >
            Essayer maintenant — gratuit
          </Link>
          <Link
            href="/register"
            className="border border-[#3f3f46] hover:border-[#cf7d56] text-[#a1a1aa] hover:text-white transition-colors px-8 py-3.5 rounded-xl font-semibold text-lg"
          >
            Créer un compte
          </Link>
        </div>

        {/* AI Models */}
        <div className="flex flex-wrap justify-center gap-3 mb-20">
          {AI_MODELS.map((ai) => (
            <div
              key={ai.provider}
              className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-4 py-2"
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ai.color }}></div>
              <span className="text-sm font-medium">{ai.name}</span>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl w-full">
          {[
            {
              icon: '⚡',
              title: 'Réponse optimale',
              desc: 'Une IA arbitre indépendante analyse et sélectionne la meilleure réponse parmi toutes les IA.',
            },
            {
              icon: '🔍',
              title: 'Comparaison transparente',
              desc: 'Consultez chaque réponse individuellement et comparez les IA côte à côte.',
            },
            {
              icon: '🎯',
              title: 'IA recommandées',
              desc: 'Le système sélectionne automatiquement les meilleures IA selon votre type de question.',
            },
            {
              icon: '⚔️',
              title: 'Mode Débat',
              desc: 'Deux IA s\'affrontent sur un sujet contradictoire, une troisième IA arbitre et tranche.',
            },
            {
              icon: '🛡️',
              title: 'Détection d\'erreurs',
              desc: 'Quand les IA divergent sur une réponse, Orch.AI vous alerte. Le consensus = fiabilité.',
              highlight: true,
            },
            {
              icon: '🌐',
              title: 'Sources web en temps réel',
              desc: 'Chaque IA consulte jusqu\'à 5 sources web récentes pour enrichir ses réponses.',
            },
          ].map((f) => (
            <div key={f.title} className={`rounded-xl p-6 text-left border ${f.highlight ? 'bg-[#cf7d56]/8 border-[#cf7d56]/30' : 'bg-[#18181b] border-[#27272a]'}`}>
              <div className="text-xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div className="mt-16 max-w-4xl w-full">
          <p className="text-sm text-[#a1a1aa] mb-4">IA recommandées selon votre domaine :</p>
          <div className="flex flex-wrap justify-center gap-2">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <span
                key={key}
                className="bg-[#18181b] border border-[#27272a] rounded-full px-3 py-1 text-sm text-[#a1a1aa]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#27272a] px-6 py-4 text-center text-sm text-[#52525b]">
        orch.AI © 2026
      </footer>
    </div>
  )
}
