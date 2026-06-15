import Link from 'next/link'

export const metadata = { title: 'Politique de confidentialité — Orch.AI' }

export default function PrivacyPage() {
  const updated = '3 juin 2026'
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-[var(--tx2)]">
      <Link href="/chat" className="text-[var(--mu2)] hover:text-[var(--fg)] text-sm mb-8 inline-block">← Retour</Link>

      <h1 className="text-3xl font-bold text-[var(--fg)] mb-2">Politique de confidentialité</h1>
      <p className="text-[var(--mu2)] text-sm mb-10">Dernière mise à jour : {updated}</p>

      <div className="space-y-8 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">1. Responsable du traitement</h2>
          <p>Orch AI SAS, société par actions simplifiée unipersonnelle en cours de création, ci-après « Orch.AI », « nous » ou « la Société ».</p>
          <p className="mt-2">Contact : <a href="mailto:privacy@getorch.ai" className="text-[#cf7d56] hover:underline">privacy@getorch.ai</a></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">2. Données collectées</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--mu1)]">
            <li>Adresse e-mail et nom (à l'inscription)</li>
            <li>Conversations et messages envoyés aux IA</li>
            <li>Données d'usage (nombre de requêtes, plan souscrit)</li>
            <li>Adresse IP (à des fins de sécurité et de limitation d'utilisation)</li>
            <li>Préférences de l'application (stockées localement)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">3. Fournisseurs d'IA tiers</h2>
          <p className="mb-3">Orch.AI transmet vos messages aux fournisseurs d'IA que vous sélectionnez. Chaque fournisseur possède sa propre politique de confidentialité :</p>
          <div className="space-y-2">
            {[
              { name: 'OpenAI (GPT)', loc: '🇺🇸 États-Unis', url: 'https://openai.com/policies/privacy-policy' },
              { name: 'Anthropic (Claude)', loc: '🇺🇸 États-Unis', url: 'https://www.anthropic.com/privacy' },
              { name: 'Google (Gemini)', loc: '🇺🇸 États-Unis', url: 'https://policies.google.com/privacy' },
              { name: 'Mistral AI', loc: '🇫🇷 France (UE)', url: 'https://mistral.ai/privacy/' },
              { name: 'Perplexity AI', loc: '🇺🇸 États-Unis', url: 'https://www.perplexity.ai/privacy' },
              { name: 'xAI (Grok)', loc: '🇺🇸 États-Unis', url: 'https://x.ai/privacy' },
              { name: 'Groq / Llama', loc: '🇺🇸 États-Unis', url: 'https://groq.com/privacy-policy/' },
            ].map((ai) => (
              <div key={ai.name} className="flex items-center justify-between bg-[var(--sur2)] rounded-lg px-3 py-2">
                <span className="text-[var(--fg)]">{ai.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--mu2)] text-xs">{ai.loc}</span>
                  <a href={ai.url} target="_blank" rel="noopener noreferrer" className="text-[#cf7d56] hover:underline text-xs">Politique →</a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-amber-400 mb-3">⚠️ 4. DeepSeek — Avertissement spécial</h2>
          <p className="text-[var(--mu1)] mb-2">
            DeepSeek est un modèle d'IA développé par <strong className="text-[var(--fg)]">DeepSeek AI (Hangzhou DeepSeek Artificial Intelligence Co., Ltd.)</strong>, une entreprise basée en République Populaire de Chine.
          </p>
          <p className="text-[var(--mu1)] mb-2">
            L'utilisation de DeepSeek implique le transfert de vos données vers des serveurs situés en Chine, <strong className="text-[var(--fg)]">en dehors de l'Espace Économique Européen (EEE)</strong>, dans un pays ne bénéficiant pas d'une décision d'adéquation de la Commission européenne au titre du RGPD.
          </p>
          <ul className="list-disc list-inside space-y-1 text-[var(--mu1)] text-xs mt-3">
            <li>Ne partagez pas d'informations personnelles, médicales, financières ou professionnelles via DeepSeek</li>
            <li>Vos données peuvent être soumises à la législation chinoise sur les données (Cybersecurity Law, Data Security Law)</li>
            <li>Un consentement explicite vous est demandé avant toute utilisation de ce modèle</li>
          </ul>
          <a href="https://www.deepseek.com/privacy" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs text-amber-400 hover:underline">Politique de confidentialité DeepSeek →</a>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">5. Base légale du traitement (RGPD)</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--mu1)]">
            <li><strong className="text-[var(--fg)]">Exécution du contrat</strong> — traitement nécessaire à la fourniture du service</li>
            <li><strong className="text-[var(--fg)]">Consentement</strong> — pour l'utilisation de DeepSeek et les communications marketing</li>
            <li><strong className="text-[var(--fg)]">Intérêt légitime</strong> — sécurité, prévention des abus</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">6. Conservation des données</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--mu1)]">
            <li>Conversations : conservées tant que le compte est actif, supprimées à la clôture du compte</li>
            <li>Données de compte : 3 ans après la dernière activité</li>
            <li>Données de facturation : 10 ans (obligation légale)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">7. Vos droits</h2>
          <p className="mb-2 text-[var(--mu1)]">Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside space-y-1 text-[var(--mu1)]">
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement ("droit à l'oubli")</li>
            <li>Droit à la portabilité</li>
            <li>Droit d'opposition et de limitation</li>
            <li>Droit de retirer votre consentement à tout moment</li>
          </ul>
          <p className="mt-3 text-[var(--mu1)]">Pour exercer vos droits : <a href="mailto:privacy@getorch.ai" className="text-[#cf7d56] hover:underline">privacy@getorch.ai</a></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">8. Cookies et stockage local</h2>
          <p className="text-[var(--mu1)]">Orch.AI utilise des cookies essentiels pour l'authentification et le stockage local (localStorage) pour vos préférences. Aucun cookie publicitaire tiers n'est utilisé sans votre consentement.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">9. Contact & réclamations</h2>
          <p className="text-[var(--mu1)]">Pour toute question : <a href="mailto:privacy@getorch.ai" className="text-[#cf7d56] hover:underline">privacy@getorch.ai</a></p>
          <p className="mt-2 text-[var(--mu1)]">Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#cf7d56] hover:underline">CNIL</a> (Commission Nationale de l'Informatique et des Libertés).</p>
        </section>

      </div>
    </div>
  )
}
