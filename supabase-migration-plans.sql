-- ============================================================
-- Migration : Système de plans & quotas
-- Orch.AI — à exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter la colonne plan à profiles (si pas encore faite)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

-- 2. Contrainte sur les valeurs acceptées
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'unlimited', 'dev'));

-- 3. Mettre les anciens "premium" → "unlimited"
UPDATE public.profiles
  SET plan = 'unlimited'
  WHERE plan = 'premium';

-- 4. daily_usage : changer la colonne date de DATE → TEXT
--    (pour stocker 'YYYY-MM' pour les quotas mensuels et 'lifetime' pour les visiteurs)
ALTER TABLE public.daily_usage
  ALTER COLUMN date TYPE TEXT USING date::TEXT;

-- Supprimer la valeur par défaut DATE et mettre TEXT
ALTER TABLE public.daily_usage
  ALTER COLUMN date DROP DEFAULT;

-- 5. Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_daily_usage_identifier_date
  ON public.daily_usage (identifier, date);

CREATE INDEX IF NOT EXISTS idx_profiles_plan
  ON public.profiles (plan);

-- 6. Vue utilitaire : usage du mois en cours par utilisateur
CREATE OR REPLACE VIEW public.current_month_usage AS
SELECT
  p.id,
  p.email,
  p.plan,
  COALESCE(u.count, 0) AS credits_used,
  CASE p.plan
    WHEN 'free'      THEN 50
    WHEN 'starter'   THEN 150
    WHEN 'pro'       THEN 500
    WHEN 'unlimited' THEN NULL
    WHEN 'dev'       THEN NULL
    ELSE 50
  END AS credits_limit
FROM public.profiles p
LEFT JOIN public.daily_usage u
  ON u.identifier = p.id::TEXT
  AND u.date = TO_CHAR(NOW(), 'YYYY-MM');

-- 7. Politique RLS : l'admin peut voir et modifier tous les plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Admin peut modifier les plans'
  ) THEN
    CREATE POLICY "Admin peut modifier les plans"
      ON public.profiles
      FOR UPDATE
      USING (auth.jwt() ->> 'email' = current_setting('app.admin_email', TRUE));
  END IF;
END $$;

-- ============================================================
-- Résumé des plans
-- ============================================================
-- visitor  : 3 crédits à vie,    2 IA max, [gemini, mistral, deepseek, groq]
-- free     : 50 crédits/mois,    2 IA max, [gemini, mistral, deepseek, groq]
-- starter  : 150 crédits/mois,   4 IA max, [+ openai, perplexity]
-- pro      : 500 crédits/mois,   6 IA max, [+ grok, anthropic]
-- unlimited: ∞ crédits,          8 IA max, toutes les IA
-- dev      : ∞ crédits,          8 IA max, toutes les IA (admin)
-- ============================================================
