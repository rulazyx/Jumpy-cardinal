-- Classement en ligne de Jumpy Cardinal (Supabase).
-- Pas de compte : chaque appareil a un identifiant et un secret générés au premier lancement.
-- La table n'est lisible qu'à travers les fonctions ci-dessous.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.jc_players (
  id uuid primary key,
  secret_hash text not null,
  pseudo text not null,
  best int not null default 0 check (best between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists jc_players_pseudo_key on public.jc_players (lower(pseudo));
create index if not exists jc_players_best_idx on public.jc_players (best desc);
alter table public.jc_players enable row level security;   -- aucune policy : pas d'accès direct

-- Crée ou met à jour le joueur (pseudo, meilleur score) et renvoie son rang.
create or replace function public.jc_sync_player(p_id uuid, p_secret text, p_pseudo text, p_score int)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_best int;
begin
  p_pseudo := btrim(p_pseudo);
  if p_pseudo !~ '^[[:alnum:]_ .-]{3,16}$' then raise exception 'pseudo_invalide'; end if;
  if p_score < 0 or p_score > 100000 then raise exception 'score_invalide'; end if;
  if length(p_secret) < 32 then raise exception 'secret_invalide'; end if;
  select secret_hash into v_hash from jc_players where id = p_id for update;
  begin
    if v_hash is null then
      insert into jc_players (id, secret_hash, pseudo, best) values (p_id, crypt(p_secret, gen_salt('bf')), p_pseudo, p_score);
    elsif crypt(p_secret, v_hash) <> v_hash then
      raise exception 'secret_invalide';
    else
      update jc_players set pseudo = p_pseudo, best = greatest(best, p_score), updated_at = now() where id = p_id;
    end if;
  exception when unique_violation then raise exception 'pseudo_pris';
  end;
  select best into v_best from jc_players where id = p_id;
  return 1 + (select count(*) from jc_players where best > v_best);
end $$;

create or replace function public.jc_top_scores(p_limit int default 50)
returns table (pseudo text, best int) language sql stable security definer set search_path = public as $$
  select pseudo, best from jc_players where best > 0 order by best desc, updated_at asc limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.jc_sync_player(uuid, text, text, int) from public;
revoke all on function public.jc_top_scores(int) from public;
grant execute on function public.jc_sync_player(uuid, text, text, int) to anon, authenticated;
grant execute on function public.jc_top_scores(int) to anon, authenticated;
