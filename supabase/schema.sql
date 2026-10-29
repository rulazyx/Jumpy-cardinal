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
create or replace function public.jc_sync_player(p_id uuid, p_secret text, p_pseudo text, p_score int)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_old text; v_best int;
begin
  p_pseudo := btrim(p_pseudo);
  if p_pseudo !~ '^[[:alnum:]_ .-]{3,16}$' then raise exception 'pseudo_invalide'; end if;
  if jc_bad_pseudo(p_pseudo) then raise exception 'pseudo_interdit'; end if;
  if p_score < 0 or p_score > 100000 then raise exception 'score_invalide'; end if;
  if length(p_secret) < 32 then raise exception 'secret_invalide'; end if;
  select secret_hash, pseudo into v_hash, v_old from jc_players where id = p_id for update;
  begin
    if v_hash is null then
      insert into jc_players (id, secret_hash, pseudo, best) values (p_id, crypt(p_secret, gen_salt('bf')), p_pseudo, p_score);
    elsif crypt(p_secret, v_hash) <> v_hash then
      raise exception 'secret_invalide';
    else
      update jc_players set pseudo = p_pseudo, best = greatest(best, p_score), updated_at = now(),
        hidden = case when lower(v_old) = lower(p_pseudo) then hidden else false end where id = p_id;
      if lower(v_old) <> lower(p_pseudo) then delete from jc_reports where target = p_id; end if;
    end if;
  exception when unique_violation then raise exception 'pseudo_pris';
  end;
  select best into v_best from jc_players where id = p_id;
  return 1 + (select count(*) from jc_players where best > v_best and not hidden);
end $$;

create or replace function public.jc_top_scores(p_limit int default 50)
returns table (pseudo text, best int) language sql stable security definer set search_path = public as $$
  select pseudo, best from jc_players where best > 0 and not hidden order by best desc, updated_at asc limit least(greatest(p_limit, 1), 100);
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

revoke all on function public.jc_bad_pseudo(text) from public;
revoke all on function public.jc_report(uuid, text, text) from public;
revoke all on function public.jc_delete_player(uuid, text) from public;
grant execute on function public.jc_report(uuid, text, text) to anon, authenticated;
grant execute on function public.jc_delete_player(uuid, text) to anon, authenticated;
grant execute on function public.jc_bad_pseudo(text) to anon, authenticated;
revoke all on function public.jc_sync_player(uuid, text, text, int) from public;
revoke all on function public.jc_top_scores(int) from public;
grant execute on function public.jc_sync_player(uuid, text, text, int) to anon, authenticated;
grant execute on function public.jc_top_scores(int) to anon, authenticated;
