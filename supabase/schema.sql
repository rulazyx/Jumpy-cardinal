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


-- ---------- Modération (règle 1.2 de l'App Store : filtre, signalement, masquage, suppression) ----------
-- Même liste que www/moderation.js. Pseudo normalisé : minuscules, sans accents, chiffres « leet » remplacés, lettres répétées fusionnées.
create or replace function public.jc_bad_pseudo(p text) returns boolean language sql immutable set search_path = public as $$
  with n as (select translate(lower(p), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ0134578@$!|', 'aaaaaaceeeeiiiinooooouuuuyyoieastbasii') as t)
  select regexp_replace(regexp_replace(t, '[^a-z]', '', 'g'), '(.)\1+', '\1', 'g') ~ '(conard|conase|salope|salaud|putain|encul|batard|couile|gouine|negre|bougnoul|youpin|nazi|hitler|merde|foutre|branleur|poufiase|enfoir|trouduc|zizi|penis|vagin|porno|tapete|fdp|fuck|shit|bitch|cunt|dick|pusy|niger|niga|fagot|whore|slut|porn|ashole|bastard)'
      or t ~ '(^|[^a-z])(con|cul|pd|pede|pute|bite|viol|nique|niquer|ntm|tg|chatte|negro|catin|fag|sex|cock|rape|retard|kys)([^a-z]|$)'
  from n;
$$;

alter table public.jc_players add column if not exists hidden boolean not null default false;   -- masqué du classement après 3 signalements
create table if not exists public.jc_reports (
  reporter uuid not null references public.jc_players(id) on delete cascade,
  target uuid not null references public.jc_players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reporter, target)
);
alter table public.jc_reports enable row level security;   -- aucune policy : pas d'accès direct

-- Vérifie le secret d'un appareil (renvoie faux si le joueur n'existe pas ou si le secret ne correspond pas)
create or replace function public.jc_auth(p_id uuid, p_secret text) returns boolean language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from jc_players where id = p_id and secret_hash = crypt(p_secret, secret_hash));
$$;
revoke all on function public.jc_auth(uuid, text) from public, anon, authenticated;

-- Crée ou met à jour le joueur (pseudo, meilleur score) et renvoie son rang. Changer de pseudo efface les signalements reçus.
-- Profil affiché aux amis et dans le classement : oiseau porté, cadre, niveau
alter table public.jc_players add column if not exists bird text not null default 'cardinal';
alter table public.jc_players add column if not exists frame text not null default 'simple';
alter table public.jc_players add column if not exists level int not null default 1;

drop function if exists public.jc_sync_player(uuid, text, text, int);
create or replace function public.jc_sync_player(p_id uuid, p_secret text, p_pseudo text, p_score int,
  p_bird text default 'cardinal', p_frame text default 'simple', p_level int default 1)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_old text; v_best int;
begin
  p_pseudo := btrim(p_pseudo);
  if p_pseudo !~ '^[[:alnum:]_ .-]{3,16}$' then raise exception 'pseudo_invalide'; end if;
  if jc_bad_pseudo(p_pseudo) then raise exception 'pseudo_interdit'; end if;
  if p_score < 0 or p_score > 100000 then raise exception 'score_invalide'; end if;
  if length(p_secret) < 32 then raise exception 'secret_invalide'; end if;
  if p_bird !~ '^[a-z]{1,20}$' or p_frame !~ '^[a-z]{1,20}$' or p_level not between 1 and 999 then raise exception 'profil_invalide'; end if;
  select secret_hash, pseudo into v_hash, v_old from jc_players where id = p_id for update;
  begin
    if v_hash is null then
      insert into jc_players (id, secret_hash, pseudo, best, bird, frame, level) values (p_id, crypt(p_secret, gen_salt('bf')), p_pseudo, p_score, p_bird, p_frame, p_level);
    elsif crypt(p_secret, v_hash) <> v_hash then
      raise exception 'secret_invalide';
    else
      update jc_players set pseudo = p_pseudo, best = greatest(best, p_score), bird = p_bird, frame = p_frame, level = greatest(level, p_level), updated_at = now(),
        hidden = case when lower(v_old) = lower(p_pseudo) then hidden else false end where id = p_id;
      if lower(v_old) <> lower(p_pseudo) then delete from jc_reports where target = p_id; end if;
    end if;
  exception when unique_violation then raise exception 'pseudo_pris';
  end;
  select best into v_best from jc_players where id = p_id;
  return 1 + (select count(*) from jc_players where best > v_best and not hidden);
end $$;

drop function if exists public.jc_top_scores(int);
create or replace function public.jc_top_scores(p_limit int default 50)
returns table (pseudo text, best int, bird text, frame text, level int) language sql stable security definer set search_path = public as $$
  select pseudo, best, bird, frame, level from jc_players where best > 0 and not hidden order by best desc, updated_at asc limit least(greatest(p_limit, 1), 100);
$$;

-- Signaler un pseudo : il disparaît du classement après 3 signalements de joueurs différents
create or replace function public.jc_report(p_id uuid, p_secret text, p_pseudo text) returns void
language plpgsql security definer set search_path = public as $$
declare v_target uuid;
begin
  if not jc_auth(p_id, p_secret) then raise exception 'secret_invalide'; end if;
  select id into v_target from jc_players where lower(pseudo) = lower(btrim(p_pseudo));
  if v_target is null or v_target = p_id then return; end if;
  insert into jc_reports (reporter, target) values (p_id, v_target) on conflict do nothing;
  update jc_players set hidden = true where id = v_target and (select count(*) from jc_reports where target = v_target) >= 3;
end $$;

-- Supprimer ses données du classement (pseudo, score, signalements)
create or replace function public.jc_delete_player(p_id uuid, p_secret text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not jc_auth(p_id, p_secret) then raise exception 'secret_invalide'; end if;
  delete from jc_players where id = p_id;
end $$;

-- ---------- Amis : on suit des joueurs par leur pseudo (pas besoin qu'ils acceptent, on ne voit que pseudo, profil et record) ----------
create table if not exists public.jc_friends (
  owner uuid not null references public.jc_players(id) on delete cascade,
  friend uuid not null references public.jc_players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner, friend)
);
alter table public.jc_friends enable row level security;   -- aucune policy : pas d'accès direct

-- Ajouter un ami par son pseudo (erreur « joueur_introuvable » s'il n'existe pas ou est masqué)
create or replace function public.jc_add_friend(p_id uuid, p_secret text, p_pseudo text) returns void
language plpgsql security definer set search_path = public as $$
declare v_friend uuid;
begin
  if not jc_auth(p_id, p_secret) then raise exception 'secret_invalide'; end if;
  select id into v_friend from jc_players where lower(pseudo) = lower(btrim(p_pseudo)) and not hidden;
  if v_friend is null or v_friend = p_id then raise exception 'joueur_introuvable'; end if;
  if (select count(*) from jc_friends where owner = p_id) >= 100 then raise exception 'trop_amis'; end if;
  insert into jc_friends (owner, friend) values (p_id, v_friend) on conflict do nothing;
end $$;

create or replace function public.jc_remove_friend(p_id uuid, p_secret text, p_pseudo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not jc_auth(p_id, p_secret) then raise exception 'secret_invalide'; end if;
  delete from jc_friends f using jc_players p where f.owner = p_id and f.friend = p.id and lower(p.pseudo) = lower(btrim(p_pseudo));
end $$;

-- Mes amis et moi, classés par record
create or replace function public.jc_friend_scores(p_id uuid, p_secret text)
returns table (pseudo text, best int, bird text, frame text, level int) language plpgsql stable security definer set search_path = public as $$
begin
  if not jc_auth(p_id, p_secret) then raise exception 'secret_invalide'; end if;
  return query select p.pseudo, p.best, p.bird, p.frame, p.level from jc_players p
    where p.id = p_id or (p.id in (select friend from jc_friends where owner = p_id) and not p.hidden)
    order by p.best desc, p.updated_at asc;
end $$;

-- ---------- Support et signalement de bugs (lus par l'équipe dans Supabase, table jc_feedback) ----------
create table if not exists public.jc_feedback (
  id bigint generated always as identity primary key,
  player uuid references public.jc_players(id) on delete set null,
  kind text not null check (kind in ('bug', 'support')),
  message text not null check (length(message) between 3 and 2000),
  contact text check (length(contact) <= 200),
  info text check (length(info) <= 500),
  created_at timestamptz not null default now()
);
alter table public.jc_feedback enable row level security;   -- aucune policy : pas d'accès direct

-- Envoyer un message (5 par jour et par appareil au plus)
create or replace function public.jc_send_feedback(p_id uuid, p_secret text, p_kind text, p_message text, p_contact text default null, p_info text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not jc_auth(p_id, p_secret) then raise exception 'secret_invalide'; end if;
  if (select count(*) from jc_feedback where player = p_id and created_at > now() - interval '1 day') >= 5 then raise exception 'trop_messages'; end if;
  insert into jc_feedback (player, kind, message, contact, info) values (p_id, p_kind, btrim(p_message), nullif(btrim(p_contact), ''), left(p_info, 500));
end $$;

revoke all on function public.jc_bad_pseudo(text) from public;
revoke all on function public.jc_report(uuid, text, text) from public;
revoke all on function public.jc_delete_player(uuid, text) from public;
grant execute on function public.jc_report(uuid, text, text) to anon, authenticated;
grant execute on function public.jc_delete_player(uuid, text) to anon, authenticated;
grant execute on function public.jc_bad_pseudo(text) to anon, authenticated;
revoke all on function public.jc_sync_player(uuid, text, text, int, text, text, int) from public;
revoke all on function public.jc_top_scores(int) from public;
grant execute on function public.jc_sync_player(uuid, text, text, int, text, text, int) to anon, authenticated;
grant execute on function public.jc_top_scores(int) to anon, authenticated;
revoke all on function public.jc_add_friend(uuid, text, text) from public;
revoke all on function public.jc_remove_friend(uuid, text, text) from public;
revoke all on function public.jc_friend_scores(uuid, text) from public;
revoke all on function public.jc_send_feedback(uuid, text, text, text, text, text) from public;
grant execute on function public.jc_add_friend(uuid, text, text) to anon, authenticated;
grant execute on function public.jc_remove_friend(uuid, text, text) to anon, authenticated;
grant execute on function public.jc_friend_scores(uuid, text) to anon, authenticated;
grant execute on function public.jc_send_feedback(uuid, text, text, text, text, text) to anon, authenticated;
