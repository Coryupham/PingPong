-- Custom SQL migration file, put your code below! --
alter table public.matches
  add column if not exists player_one_name text,
  add column if not exists player_one_email text,
  add column if not exists player_two_name text,
  add column if not exists player_two_email text,
  add column if not exists winner_name text,
  add column if not exists winner_email text,
  add column if not exists first_server_name text,
  add column if not exists first_server_email text;--> statement-breakpoint

update public.matches m
set
  player_one_name = (select p.display_name from public.players p where p.id = m.player_one_id),
  player_one_email = (select p.email from public.players p where p.id = m.player_one_id),
  player_two_name = (select p.display_name from public.players p where p.id = m.player_two_id),
  player_two_email = (select p.email from public.players p where p.id = m.player_two_id),
  winner_name = (select p.display_name from public.players p where p.id = m.winner_id),
  winner_email = (select p.email from public.players p where p.id = m.winner_id),
  first_server_name = (select p.display_name from public.players p where p.id = m.first_server_id),
  first_server_email = (select p.email from public.players p where p.id = m.first_server_id);--> statement-breakpoint
