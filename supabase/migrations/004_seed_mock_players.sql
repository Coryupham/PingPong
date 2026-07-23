delete from public.rating_events;
delete from public.matches;
delete from public.players;

insert into public.players (
  display_name,
  email,
  pin_hash,
  rating,
  wins,
  losses,
  games_played,
  points_for,
  points_against
) values
  (
    'Alex Ace',
    'alex@example.com',
    '$2a$12$0WBz3ckb4oEivzxbX5NGp.Mq6pm5GlNlGspuStNkO2h3Lm/GFkbim',
    1000,
    0,
    0,
    0,
    0,
    0
  ),
  (
    'Bella Backspin',
    'bella@example.com',
    '$2a$12$WCKKIAVe/R4Jz74YcAmyOOXa4VY8jX75wvsDUidlBbSYnrvd418Yq',
    1000,
    0,
    0,
    0,
    0,
    0
  ),
  (
    'Charlie Chop',
    'charlie@example.com',
    '$2a$12$.UWfd4nt6LnLtFIMBf5DReYqG3nPxSUHWpzP4ljnsWMlJfE303Tam',
    1000,
    0,
    0,
    0,
    0,
    0
  ),
  (
    'Daisy Drive',
    'daisy@example.com',
    '$2a$12$OVJvrGwi2hJ5G5tPabO6aeFRmJJzfe7dV3Gjr7pF336GwDM3k17xK',
    1000,
    0,
    0,
    0,
    0,
    0
  ),
  (
    'Evan Edge',
    'evan@example.com',
    '$2a$12$NTt9BMOXFHmOtcOJIZp5..33N1RPYDvsJXAVnELNLRRFnnWx7v0hm',
    1000,
    0,
    0,
    0,
    0,
    0
  ),
  (
    'Nina Net',
    'nina@example.com',
    '$2a$12$nPpMy0CJXNCPjQHtveJSS.GHZnDA99liL3oodnPVOEEvmbl4mx19m',
    1000,
    0,
    0,
    0,
    0,
    0
  );
