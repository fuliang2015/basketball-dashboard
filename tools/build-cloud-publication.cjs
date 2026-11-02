// Build an atomic private publication. Inputs/output must be outside the public repo.
const fs=require('fs'),crypto=require('crypto');
const {prepareConverted}=require('../game-import.js');
const [identityFile,reportFile,outFile,...datasets]=process.argv.slice(2);
if(!datasets.length)throw Error('Usage: node tools/build-cloud-publication.cjs identity.json report.json output.sql dataset.json ...');
const identity=JSON.parse(fs.readFileSync(identityFile,'utf8')),report=JSON.parse(fs.readFileSync(reportFile,'utf8'));
for(const k of ['family_id','player_id','created_by'])if(!/^[0-9a-f-]{36}$/i.test(identity[k]))throw Error('Invalid identity');
if(!Number.isSafeInteger(identity.version)||identity.version<1)throw Error('Invalid version');
let games=[];
for(const file of datasets){const raw=fs.readFileSync(file,'utf8'),x=JSON.parse(raw);
for(const g of prepareConverted(x,identity.team,identity.player)){
games.push({source_key:g.importReview.sourceGameId,date:g.date,opponent:g.opponent,statistics:g,
source_notes:[{kind:'source',sha256:crypto.createHash('sha256').update(raw).digest('hex'),verification:'transcribed-unverified'},...g.importReview.issues]});
}}
if(new Set(games.map(g=>g.source_key)).size!==games.length)throw Error('Duplicate source keys');
report.game_versions=games.map(g=>({source_key:g.source_key,version:identity.version})).sort((a,b)=>a.source_key.localeCompare(b.source_key));
report.profile={name:identity.player,team:identity.team};
const hash=crypto.createHash('sha256').update(JSON.stringify({games,report})).digest('hex');
const q=x=>"'"+JSON.stringify(x).replace(/'/g,"''")+"'::jsonb";
const {family_id:f,player_id:p,created_by:a,version:v}=identity;
const sql=`begin;
create temporary table publication_input on commit drop as select * from jsonb_to_recordset(${q(games)}) as x(source_key text,date date,opponent text,statistics jsonb,source_notes jsonb);
do $check$ begin
if not exists(select 1 from public.bj_members where family_id='${f}' and user_id='${a}' and role='parent') or not exists(select 1 from public.bj_members where family_id='${f}' and user_id='${p}' and role='player') then raise exception 'Invalid family mapping'; end if;
if exists(select 1 from public.bj_games g join publication_input x using(source_key) where g.family_id='${f}' and g.player_id='${p}' and g.version=${v} and (g.statistics<>x.statistics or g.source_notes<>x.source_notes)) then raise exception 'Existing revision differs; use a new version'; end if;
end $check$;
insert into public.bj_games(family_id,player_id,source_key,version,played_on,opponent,state,statistics,source_notes,created_by)
select '${f}','${p}',source_key,${v},date,opponent,'published',statistics,source_notes,'${a}' from publication_input
on conflict(family_id,player_id,source_key,version) do nothing;
insert into public.bj_analysis_jobs(family_id,player_id,input_fingerprint,input_versions,state)
values('${f}','${p}','${hash}',${q({games:report.game_versions,shared_reflections:[],generation:'local-ai-assisted-publication'})},'succeeded')
on conflict(family_id,player_id,input_fingerprint) do nothing;
insert into public.bj_reports(family_id,player_id,job_id,body,model_version,prompt_version,published_at)
select '${f}','${p}',id,${q(report)},'local-codex-assisted','development-report-v1',now() from public.bj_analysis_jobs
where family_id='${f}' and player_id='${p}' and input_fingerprint='${hash}' on conflict(job_id) do nothing;
commit;
select count(*) as games, sum(jsonb_array_length(statistics->'importReview'->'roster')) as roster_rows from public.bj_games where family_id='${f}' and player_id='${p}' and version=${v};
`;
fs.writeFileSync(outFile,sql);console.log(JSON.stringify({games:games.length,roster_rows:games.reduce((n,g)=>n+g.statistics.importReview.roster.length,0),version:v,report_sha256:hash}));
