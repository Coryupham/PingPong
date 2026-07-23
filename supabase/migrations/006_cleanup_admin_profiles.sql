alter table public.profiles drop column if exists pin_hash;
alter table public.profiles drop column if exists rating;
alter table public.profiles drop column if exists wins;
alter table public.profiles drop column if exists losses;
alter table public.profiles drop column if exists games_played;
alter table public.profiles drop column if exists points_for;
alter table public.profiles drop column if exists points_against;
