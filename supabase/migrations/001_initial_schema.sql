create extension if not exists "pgcrypto";

create type invite_status as enum ('pending', 'accepted', 'declined', 'canceled', 'expired');
create type match_status as enum ('final', 'voided', 'corrected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) >= 2),
  email text,
  pin_hash text not null,
  is_admin boolean not null default false,
  rating integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  games_played integer not null default 0,
  points_for integer not null default 0,
  points_against integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_invites (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  opponent_id uuid not null references public.profiles(id) on delete cascade,
  status invite_status not null default 'pending',
  message text,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_invites check (challenger_id <> opponent_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  player_one_id uuid not null references public.profiles(id),
  player_two_id uuid not null references public.profiles(id),
  player_one_score integer not null check (player_one_score >= 0 and player_one_score <= 99),
  player_two_score integer not null check (player_two_score >= 0 and player_two_score <= 99),
  winner_id uuid not null references public.profiles(id),
  first_server_id uuid references public.profiles(id),
  invite_id uuid references public.game_invites(id),
  status match_status not null default 'final',
  submitted_by uuid not null references public.profiles(id),
  confirmed_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_matches check (player_one_id <> player_two_id),
  constraint winner_is_participant check (winner_id in (player_one_id, player_two_id)),
  constraint first_server_is_participant check (first_server_id is null or first_server_id in (player_one_id, player_two_id)),
  constraint submitter_is_participant check (submitted_by in (player_one_id, player_two_id)),
  constraint confirmer_is_participant check (confirmed_by in (player_one_id, player_two_id))
);

create table public.rating_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  rating_before integer not null,
  rating_after integer not null,
  rating_delta integer not null,
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null,
  target_table text not null,
  target_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index profiles_rankings_idx on public.profiles (rating desc, wins desc, games_played desc);
create index invites_challenger_idx on public.game_invites (challenger_id, status, created_at desc);
create index invites_opponent_idx on public.game_invites (opponent_id, status, created_at desc);
create index matches_recent_idx on public.matches (created_at desc);
create index rating_events_match_idx on public.rating_events (match_id);
create index admin_audit_recent_idx on public.admin_audit_log (created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger invites_touch_updated_at
before update on public.game_invites
for each row execute function public.touch_updated_at();

create trigger matches_touch_updated_at
before update on public.matches
for each row execute function public.touch_updated_at();

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.game_invites enable row level security;
alter table public.matches enable row level security;
alter table public.rating_events enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "profiles are visible to authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "users can insert their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "users can update their own non-admin profile"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.current_user_is_admin())
with check (id = auth.uid() or public.current_user_is_admin());

create policy "participants can view invites"
on public.game_invites for select
to authenticated
using (auth.uid() in (challenger_id, opponent_id) or public.current_user_is_admin());

create policy "users can create their own invites"
on public.game_invites for insert
to authenticated
with check (challenger_id = auth.uid() and challenger_id <> opponent_id);

create policy "participants can update invites"
on public.game_invites for update
to authenticated
using (auth.uid() in (challenger_id, opponent_id) or public.current_user_is_admin())
with check (auth.uid() in (challenger_id, opponent_id) or public.current_user_is_admin());

create policy "authenticated users can view matches"
on public.matches for select
to authenticated
using (true);

create policy "participants can submit matches"
on public.matches for insert
to authenticated
with check (auth.uid() in (player_one_id, player_two_id) and submitted_by = auth.uid());

create policy "admins can update matches"
on public.matches for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "authenticated users can view rating events"
on public.rating_events for select
to authenticated
using (true);

create policy "participants can insert rating events"
on public.rating_events for insert
to authenticated
with check (
  exists (
    select 1
    from public.matches m
    where m.id = match_id
      and auth.uid() in (m.player_one_id, m.player_two_id)
  )
);

create policy "admins can view audit log"
on public.admin_audit_log for select
to authenticated
using (public.current_user_is_admin());

create policy "admins can write audit log"
on public.admin_audit_log for insert
to authenticated
with check (public.current_user_is_admin());
