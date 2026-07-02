-- Modération : table de signalement de contenu (exigence App Store / Google Play)
-- À exécuter une fois dans Supabase → SQL Editor.

create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  reported_content text,
  provider         text,
  reason           text not null default 'non spécifié',
  status           text not null default 'open',   -- open | reviewed | dismissed
  created_at       timestamptz not null default now()
);

-- RLS activé SANS policy : seul le service role (backend) peut lire/écrire.
-- Les clients (anon / user) n'accèdent jamais directement à cette table.
alter table public.reports enable row level security;

create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
