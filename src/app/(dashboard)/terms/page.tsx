import Link from 'next/link'

export const metadata = { title: "Conditions Générales d'Utilisation — Orch.AI" }

export default function TermsPage() {
  const updated = '3 juin 2026'
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-[var(--tx2)]">
      <Link href="/chat" className="text-[var(--mu2)] hover:text-[var(--fg)] text-sm mb-8 inline-block">← Retour</Link>

      <h1 className="text-3xl font-bold text-[var(--fg)] mb-2">Conditions Générales d'Utilisation</h1>
      <p className="text-[var(--mu2)] text-sm mb-10">Dernière mise à jour : {updated}</p>

      <div className="space-y-8 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">1. Présentation du service</h2>
          <p className="text-[var(--mu1)]">Orch.AI est une plateforme d'orchestration multi-modèles d'intelligence artificielle permettant aux utilisateurs d'interroger simultanément plusieurs modèles d'IA et de comparer leurs réponses. Le service est édité par Orch AI SAS.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">2. Acceptation des conditions</h2>
          <p className="text-[var(--mu1)]">L'utilisation du service implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous devez cesser d'utiliser le service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">3. Inscription et compte</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--mu1)]">
            <li>L'inscription est ouverte à toute personne physique majeure</li>
            <li>Vous êtes responsable de la confidentialité de vos identifiants</li>
            <li>Un compte ne peut être partagé entre plusieurs personnes</li>
            <li>Vous devez fournir des informations exactes et les maintenir à jour</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">4. Plans et facturation</h2>
          <p className="text-[var(--mu1)] mb-3">Orch.AI propose plusieurs plans d'abonnement :</p>
          <div className="space-y-2">
            {[
              { name: 'Gratuit', desc: '150 000 tokens/mois, 2 IA simultanées' },
              { name: 'Starter (4,99€/mois)', desc: '450 000 tokens/mois, 4 IA simultanées' },
              { name: 'Pro (9,99€/mois)', desc: '1 500 000 tokens/mois, 6 IA simultanées' },
              { name: 'Illimité (19,99€/mois)', desc: 'Tokens illimités, 8 IA simultanées' },
            ].map((p) => (
              <div key={p.name} className="bg-[var(--sur2)] rounded-lg px-3 py-2 flex justify-between">
                <span className="text-[var(--fg)] font-medium">{p.name}</span>
                <span className="text-[var(--mu2)] text-xs">{p.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-[var(--mu1)] mt-3">Les tokens non consommés ne sont pas reportés au mois suivant. Les abonnements sont résiliables à tout moment avec effet à la fin de la période en cours.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">5. IA tierces et transferts de données</h2>
          <p className="text-[var(--mu1)] mb-2">Orch.AI agit en tant qu'intermédiaire technique. Vos messages sont transmis aux fournisseurs d'IA sélectionnés, chacun étant soumis à ses propres conditions d'utilisation.</p>
          <p className="text-[var(--mu1)]">En utilisant une IA spécifique, vous acceptez également les CGU du fournisseur correspondant (OpenAI, Anthropic, Google, Mistral, etc.).</p>
        </section>

        <section className="bg-amber-500/8 border border-amber-500/25 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-amber-400 mb-3">⚠️ 6. DeepSeek — Conditions spéciales</h2>
          <p className="text-[var(--mu1)] mb-2">L'utilisation de DeepSeek est soumise à un consentement explicite préalable en raison du transfert de données vers la Chine, en dehors du cadre RGPD européen.</p>
          <p className="text-[var(--mu1)]">En activant DeepSeek, vous reconnaissez :</p>
          <ul className="list-disc list-inside space-y-1 text-[var(--mu1)] text-xs mt-2">
            <li>Avoir été informé des risques liés au transfert de données hors UE</li>
            <li>Utiliser DeepSeek sous votre entière responsabilité</li>
            <li>Ne pas transmettre de données personnelles ou confidentielles</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">7. Utilisations interdites</h2>
          <p className="text-[var(--mu1)] mb-2">Il est strictement interdit d'utiliser Orch.AI pour :</p>
          <ul className="list-disc list-inside space-y-1 text-[var(--mu1)]">
            <li>Générer du contenu illégal, haineux, diffamatoire ou discriminatoire</li>
            <li>Usurper l'identité d'une personne ou d'une organisation</li>
            <li>Contourner les limitations techniques du service</li>
            <li>Revendre ou redistribuer l'accès au service</li>
            <li>Utiliser le service à des fins de spam ou de harcèlement</li>
            <li>Toute activité contraire aux CGU des fournisseurs d'IA sous-jacents</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">8. Propriété intellectuelle</h2>
          <p className="text-[var(--mu1)]">L'interface, le code et la marque Orch.AI sont la propriété exclusive d'Orch AI SAS. Les réponses générées par les IA appartiennent selon les cas au fournisseur et/ou à l'utilisateur, conformément aux CGU de chaque fournisseur.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">9. Limitation de responsabilité</h2>
          <p className="text-[var(--mu1)]">Orch.AI ne garantit pas l'exactitude, la fiabilité ou la complétude des réponses générées par les modèles d'IA. Les réponses ne constituent pas un avis médical, juridique, financier ou professionnel. L'utilisateur est seul responsable de l'usage qu'il fait des informations obtenues.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">10. Résiliation</h2>
          <p className="text-[var(--mu1)]">Orch.AI se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU, sans préavis ni indemnité. L'utilisateur peut supprimer son compte à tout moment depuis les paramètres.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">11. Droit applicable</h2>
          <p className="text-[var(--mu1)]">Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux compétents sont ceux du ressort du siège social d'Orch AI SAS.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--fg)] mb-3">12. Contact</h2>
          <p className="text-[var(--mu1)]">Pour toute question : <a href="mailto:legal@getorch.ai" className="text-[#cf7d56] hover:underline">legal@getorch.ai</a></p>
        </section>

      </div>

      <div className="mt-10 pt-6 border-t border-[var(--sur2)] flex gap-4 text-xs text-[var(--mu3)]">
        <Link href="/privacy" className="hover:text-[var(--mu1)]">Politique de confidentialité</Link>
        <Link href="/pricing" className="hover:text-[var(--mu1)]">Tarifs</Link>
        <Link href="/chat" className="hover:text-[var(--mu1)]">Retour à l'app</Link>
      </div>
    </div>
  )
}
