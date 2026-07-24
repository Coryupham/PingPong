do $$
begin
  create type public.tournament_status as enum ('active', 'complete');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team_count integer not null check (team_count >= 2),
  players_per_team integer not null check (players_per_team >= 1),
  teams jsonb not null default '[]'::jsonb,
  rounds jsonb not null default '[]'::jsonb,
  current_round integer not null default 1 check (current_round >= 1),
  status public.tournament_status not null default 'active',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tournaments_recent_idx on public.tournaments (created_at);

drop trigger if exists tournaments_touch_updated_at on public.tournaments;
create trigger tournaments_touch_updated_at
before update on public.tournaments
for each row execute function public.touch_updated_at();

alter table public.matches
  add column if not exists tournament_id uuid,
  add column if not exists tournament_round integer,
  add column if not exists tournament_match_id text;
