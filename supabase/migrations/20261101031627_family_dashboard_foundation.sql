
create schema if not exists bj_private;
revoke all on schema bj_private from public, anon;
grant usage on schema bj_private to authenticated;
create table public.bj_families (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now()
);
create table public.bj_members (
 family_id uuid not null references public.bj_families(id),
 user_id uuid not null references auth.users(id),
 role text not null check(role in ('parent','player')),
 primary key(family_id,user_id), unique(user_id)
);
create index bj_members_user_idx on public.bj_members(user_id);
create function bj_private.is_parent(f uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.bj_members where family_id=f and user_id=(select auth.uid()) and role='parent')
$$;
create function bj_private.is_member(f uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.bj_members where family_id=f and user_id=(select auth.uid()))
$$;
revoke all on function bj_private.is_parent(uuid),bj_private.is_member(uuid) from public,anon;
grant execute on function bj_private.is_parent(uuid),bj_private.is_member(uuid) to authenticated;
create table public.bj_games (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.bj_families(id),
 player_id uuid not null,
 source_key text not null check(length(source_key) between 1 and 150),
 version integer not null check(version>0),
 played_on date not null,
 opponent text not null check(length(opponent) between 1 and 100),
 state text not null default 'draft' check(state in ('draft','published')),
 statistics jsonb not null check(jsonb_typeof(statistics)='object'),
 source_notes jsonb not null default '[]' check(jsonb_typeof(source_notes)='array'),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(family_id,player_id) references public.bj_members(family_id,user_id),
 unique(family_id,player_id,source_key,version),
 unique(id,family_id,player_id)
);
create index bj_games_player_idx on public.bj_games(family_id,player_id,played_on desc);
create table public.bj_reflections (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null,
 player_id uuid not null,
 game_id uuid not null,
 mood text check(mood in ('Great','Good','Mixed','Tough')),
 note text not null default '' check(length(note)<=2000),
 challenge_at_time text not null default '' check(length(challenge_at_time)<=500),
 attempt text check(attempt in ('mostly','sometimes','still_working','not_sure','not_tried')),
 share_with_ai boolean not null default false,
 created_at timestamptz not null default now(),
 foreign key(game_id,family_id,player_id) references public.bj_games(id,family_id,player_id),
 unique(id,family_id,player_id)
);
create index bj_reflections_game_idx on public.bj_reflections(game_id,created_at desc);
create table public.bj_challenges (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null,
 player_id uuid not null,
 content text not null check(length(content) between 1 and 500),
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(),
 foreign key(family_id,player_id) references public.bj_members(family_id,user_id)
);
create index bj_challenges_player_idx on public.bj_challenges(family_id,player_id,created_at desc);
create table public.bj_analysis_jobs (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null,
 player_id uuid not null,
 input_fingerprint text not null check(length(input_fingerprint)=64),
 input_versions jsonb not null check(jsonb_typeof(input_versions)='object'),
 state text not null default 'queued' check(state in ('queued','running','succeeded','failed')),
 created_at timestamptz not null default now(),
 foreign key(family_id,player_id) references public.bj_members(family_id,user_id),
 unique(family_id,player_id,input_fingerprint),
 unique(id,family_id,player_id)
);
create table public.bj_reports (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null,
 player_id uuid not null,
 job_id uuid not null,
 body jsonb not null check(jsonb_typeof(body)='object'),
 model_version text not null,
 prompt_version text not null,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key(job_id,family_id,player_id) references public.bj_analysis_jobs(id,family_id,player_id),
 unique(job_id)
);
create index bj_reports_player_idx on public.bj_reports(family_id,player_id,created_at desc);

alter table public.bj_families enable row level security;
revoke all on public.bj_families from public,anon,authenticated;
grant all on public.bj_families to service_role;

alter table public.bj_members enable row level security;
revoke all on public.bj_members from public,anon,authenticated;
grant all on public.bj_members to service_role;

alter table public.bj_games enable row level security;
revoke all on public.bj_games from public,anon,authenticated;
grant all on public.bj_games to service_role;

alter table public.bj_reflections enable row level security;
revoke all on public.bj_reflections from public,anon,authenticated;
grant all on public.bj_reflections to service_role;

alter table public.bj_challenges enable row level security;
revoke all on public.bj_challenges from public,anon,authenticated;
grant all on public.bj_challenges to service_role;

alter table public.bj_analysis_jobs enable row level security;
revoke all on public.bj_analysis_jobs from public,anon,authenticated;
grant all on public.bj_analysis_jobs to service_role;

alter table public.bj_reports enable row level security;
revoke all on public.bj_reports from public,anon,authenticated;
grant all on public.bj_reports to service_role;

grant select on public.bj_families,public.bj_members,public.bj_games,public.bj_reflections,public.bj_challenges,public.bj_reports to authenticated;
grant insert on public.bj_games,public.bj_reflections,public.bj_challenges to authenticated;
create policy family_read on public.bj_families for select to authenticated using (bj_private.is_member(id));
create policy member_read on public.bj_members for select to authenticated using (user_id=(select auth.uid()) or bj_private.is_parent(family_id));
create policy game_read on public.bj_games for select to authenticated using (bj_private.is_parent(family_id) or (player_id=(select auth.uid()) and bj_private.is_member(family_id) and state='published'));
create policy game_insert on public.bj_games for insert to authenticated with check (bj_private.is_parent(family_id) and created_by=(select auth.uid()));
create policy reflection_read on public.bj_reflections for select to authenticated using (bj_private.is_member(family_id) and (player_id=(select auth.uid()) or bj_private.is_parent(family_id)));
create policy reflection_insert on public.bj_reflections for insert to authenticated with check (
 player_id=(select auth.uid()) and bj_private.is_member(family_id) and exists(
 select 1 from public.bj_games g where g.id=game_id and g.family_id=bj_reflections.family_id and g.player_id=bj_reflections.player_id and g.state='published')
);
create policy challenge_read on public.bj_challenges for select to authenticated using (bj_private.is_member(family_id) and (player_id=(select auth.uid()) or bj_private.is_parent(family_id)));
create policy challenge_insert on public.bj_challenges for insert to authenticated with check (bj_private.is_member(family_id) and created_by=(select auth.uid()) and (player_id=(select auth.uid()) or bj_private.is_parent(family_id)));
create policy report_read on public.bj_reports for select to authenticated using (bj_private.is_parent(family_id) or (bj_private.is_member(family_id) and player_id=(select auth.uid()) and published_at is not null));
comment on table public.bj_reflections is 'Append-only shared app responses. Local-only notes must not be uploaded. AI input must explicitly filter share_with_ai.';
comment on table public.bj_games is 'Append-only game versions. Server must validate statistics and coherent published revisions before client integration.';
comment on table public.bj_analysis_jobs is 'Backend-only jobs. Authenticate callers, validate membership and consent, compute input versions server-side.';
comment on table public.bj_reports is 'Backend-only writes. Validate report evidence and exact input revisions; never label stale reports as current.';

