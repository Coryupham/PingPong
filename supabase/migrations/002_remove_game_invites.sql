alter table public.matches drop column if exists invite_id;

drop table if exists public.game_invites;
drop type if exists invite_status;
