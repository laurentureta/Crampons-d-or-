-- Crampons d'Or : sauvegarde en ligne et classement mondial (Supabase)
-- Installé sur le projet Supabase « crampons-dor » (migration « sauvegarde_en_ligne_et_classement »).
-- Personne n'accède directement aux tables : tout passe par les 4 fonctions ci-dessous,
-- qui vérifient et limitent ce qu'on leur envoie. La clé publiable du jeu ne permet rien d'autre.

-- ---------- sauvegardes dans le nuage ----------
create table if not exists public.sauvegardes (
  code  text primary key check (code ~ '^[A-Z0-9]{12}$'),
  data  text not null check (length(data) <= 3000000),
  nom   text, club text, age int,
  creee timestamptz not null default now(),
  maj   timestamptz not null default now()
);
alter table public.sauvegardes enable row level security;   -- aucune règle = aucun accès direct

create or replace function public.cdo_sauver(p_code text, p_data text, p_nom text, p_club text, p_age int)
returns timestamptz language plpgsql security definer set search_path = public as $$
begin
  if p_code !~ '^[A-Z0-9]{12}$' then raise exception 'code invalide'; end if;
  if p_data is null or length(p_data) > 3000000 or left(p_data, 4) <> 'CDO2' then raise exception 'sauvegarde invalide'; end if;
  insert into sauvegardes (code, data, nom, club, age) values (p_code, p_data, left(p_nom, 40), left(p_club, 60), least(greatest(p_age, 0), 80))
  on conflict (code) do update set data = excluded.data, nom = excluded.nom, club = excluded.club, age = excluded.age, maj = now();
  return now();
end $$;

create or replace function public.cdo_charger(p_code text)
returns table (data text, nom text, club text, age int, maj timestamptz)
language sql stable security definer set search_path = public as $$
  select s.data, s.nom, s.club, s.age, s.maj from sauvegardes s where s.code = upper(p_code);
$$;

-- ---------- classement des carrières (le joueur fictif, aucune donnée personnelle) ----------
create table if not exists public.classement (
  joueur     text primary key check (joueur ~ '^[a-f0-9]{16}$'),
  nom        text not null,
  poste      text, nation text, club text,
  age        int, saison int,
  score      int not null default 0,
  note       int, buts int, selections int, trophees int, ballons_or int,
  fini       boolean not null default false,
  maj        timestamptz not null default now()
);
alter table public.classement enable row level security;
create index if not exists classement_score on public.classement (score desc);

create or replace function public.cdo_publier(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare j text := p->>'joueur';
begin
  if j !~ '^[a-f0-9]{16}$' then raise exception 'joueur invalide'; end if;
  insert into classement (joueur, nom, poste, nation, club, age, saison, score, note, buts, selections, trophees, ballons_or, fini, maj)
  values (j, left(coalesce(p->>'nom', '?'), 40), left(p->>'poste', 4), left(p->>'nation', 4), left(p->>'club', 60),
          least(greatest(coalesce((p->>'age')::int, 0), 10), 60), least(greatest(coalesce((p->>'saison')::int, 0), 2000), 2200),
          least(greatest(coalesce((p->>'score')::int, 0), 0), 5000), least(greatest(coalesce((p->>'note')::int, 0), 0), 99),
          least(greatest(coalesce((p->>'buts')::int, 0), 0), 3000), least(greatest(coalesce((p->>'selections')::int, 0), 0), 400),
          least(greatest(coalesce((p->>'trophees')::int, 0), 0), 300), least(greatest(coalesce((p->>'ballons_or')::int, 0), 0), 30),
          coalesce((p->>'fini')::boolean, false), now())
  on conflict (joueur) do update set nom = excluded.nom, poste = excluded.poste, nation = excluded.nation, club = excluded.club,
    age = excluded.age, saison = excluded.saison, score = excluded.score, note = excluded.note, buts = excluded.buts,
    selections = excluded.selections, trophees = excluded.trophees, ballons_or = excluded.ballons_or, fini = excluded.fini, maj = now();
end $$;

create or replace function public.cdo_classement(n int default 50)
returns table (joueur text, nom text, poste text, nation text, club text, age int, score int, buts int, trophees int, ballons_or int, fini boolean)
language sql stable security definer set search_path = public as $$
  select c.joueur, c.nom, c.poste, c.nation, c.club, c.age, c.score, c.buts, c.trophees, c.ballons_or, c.fini
  from classement c order by c.score desc, c.maj asc limit least(greatest(n, 1), 100);
$$;

-- 2e migration « classement_identifiants_caches » : le classement public ne montre qu'une empreinte de l'identifiant
-- secret de chaque carrière (sinon n'importe qui pourrait réécrire la ligne d'un autre) ; chacun peut retirer la sienne.
create or replace function public.cdo_top(n int default 50)
returns table (cle text, nom text, poste text, nation text, club text, age int, score int, buts int, trophees int, ballons_or int, fini boolean)
language sql stable security definer set search_path = public as $$
  select left(encode(sha256(convert_to(c.joueur, 'UTF8')), 'hex'), 16), c.nom, c.poste, c.nation, c.club, c.age, c.score, c.buts, c.trophees, c.ballons_or, c.fini
  from classement c order by c.score desc, c.maj asc limit least(greatest(n, 1), 100);
$$;

create or replace function public.cdo_retirer(p_joueur text)
returns void language sql security definer set search_path = public as $$
  delete from classement where joueur = p_joueur;
$$;

-- ---------- droits ----------
-- Les 5 fonctions ci-dessous sont l'API publique du jeu (sans compte) : l'avertissement Supabase
-- « Public Can Execute SECURITY DEFINER Function » est donc voulu. Les tables, elles, restent fermées.
revoke all on function public.cdo_sauver(text, text, text, text, int), public.cdo_charger(text),
                       public.cdo_publier(jsonb), public.cdo_top(int), public.cdo_retirer(text) from public;
grant execute on function public.cdo_sauver(text, text, text, text, int), public.cdo_charger(text),
                         public.cdo_publier(jsonb), public.cdo_top(int), public.cdo_retirer(text) to anon, authenticated;
-- l'ancienne fonction de classement montrait les identifiants secrets : plus accessible
revoke all on function public.cdo_classement(int) from public, anon, authenticated;
