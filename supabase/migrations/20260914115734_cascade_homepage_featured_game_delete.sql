alter table public.homepage_featured_games
  drop constraint homepage_featured_games_game_id_fkey,
  add constraint homepage_featured_games_game_id_fkey
    foreign key (game_id)
    references public.games (id)
    on delete cascade;
