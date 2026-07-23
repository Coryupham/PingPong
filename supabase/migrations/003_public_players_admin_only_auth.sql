create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) >= 2),
  email text not null unique,
  pin_hash text not null,
  rating integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  games_played integer not null default 0,
  points_for integer not null default 0,
  points_against integer not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.players (
  id,
  display_name,
  email,
  pin_hash,
  rating,
  wins,
  losses,
  games_played,
  points_for,
  points_against,
  created_at,
  updated_at
)
select
  id,
  display_name,
  coalesce(email, id::text || '@local.player'),
  pin_hash,
  rating,
  wins,
  losses,
  games_played,
  points_for,
  points_against,
  created_at,
  updated_at
from public.profiles
on conflict (id) do nothing;

create index if not exists players_rankings_idx on public.players (rating desc, wins desc, games_played desc);
create index if not exists players_email_idx on public.players (email);

drop trigger if exists players_touch_updated_at on public.players;
create trigger players_touch_updated_at
before update on public.players
for each row execute function public.touch_updated_at();

alter table public.matches drop constraint if exists matches_player_one_id_fkey;
alter table public.matches drop constraint if exists matches_player_two_id_fkey;
alter table public.matches drop constraint if exists matches_winner_id_fkey;
alter table public.matches drop constraint if exists matches_first_server_id_fkey;
alter table public.matches drop constraint if exists matches_submitted_by_fkey;
alter table public.matches drop constraint if exists matches_confirmed_by_fkey;

alter table public.matches
  add constraint matches_player_one_id_fkey foreign key (player_one_id) references public.players(id),
  add constraint matches_player_two_id_fkey foreign key (player_two_id) references public.players(id),
  add constraint matches_winner_id_fkey foreign key (winner_id) references public.players(id),
  add constraint matches_first_server_id_fkey foreign key (first_server_id) references public.players(id),
  add constraint matches_submitted_by_fkey foreign key (submitted_by) references public.players(id),
  add constraint matches_confirmed_by_fkey foreign key (confirmed_by) references public.players(id);

alter table public.rating_events drop constraint if exists rating_events_player_id_fkey;
alter table public.rating_events
  add constraint rating_events_player_id_fkey foreign key (player_id) references public.players(id) on delete cascade;

alter table public.players enable row level security;

drop policy if exists "admins can view players" on public.players;
create policy "admins can view players"
on public.players for select
to authenticated
using (public.current_user_is_admin());

drop policy if exists "admins can create players" on public.players;
create policy "admins can create players"
on public.players for insert
to authenticated
with check (public.current_user_is_admin());

drop policy if exists "admins can update players" on public.players;
create policy "admins can update players"
on public.players for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
