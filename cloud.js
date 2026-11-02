'use strict';
// Published data stays in memory. Device-local records are never merged or overwritten.
(() => {
  const root=document.querySelector('.app');
  for(const id of ['cloudHome','cloudGames','cloudTeam','cloudReport','cloudDetail']){
    const s=document.createElement('section');s.id=id;s.className='screen';root.append(s);
  }
  let connected=false,client=null,member=null,user=null,rows=[],reports=[],selected=null,epoch=0,lastLoad=0;
  const byId=id=>document.getElementById(id);
  const route={home:'cloudHome',progress:'cloudReport',games:'cloudGames',team:'cloudTeam'};
  const originalShow=show;
  show=function(id){
    if(connected&&['addgame','checkin'].includes(id)){
      id='settings';
    }
    const target=connected?(route[id]||id):id;
    originalShow(target);
    const tab=Object.keys(route).find(k=>route[k]===target)||(target==='cloudDetail'?'games':null);
    if(tab)document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  };
  function clearScreens(){for(const id of Object.values(route).concat('cloudDetail'))byId(id).replaceChildren();}
  function begin(){
    ++epoch;connected=true;rows=[];reports=[];selected=null;clearScreens();
    byId('cloudHome').innerHTML='<h1>Your published journey</h1><p class="card" role="status">Checking your account and loading published records…</p>';
    if(!byId('settings').classList.contains('active'))show('home');
  }
  function reset(){
    ++epoch;connected=false;client=null;member=null;user=null;rows=[];reports=[];selected=null;clearScreens();
    if(document.querySelector('.screen.active')?.id.startsWith('cloud'))show('home');
  }
  function fail(message){
    clearScreens();
    for(const id of Object.values(route))byId(id).innerHTML='<h1>Published records</h1><div class="card"><p>'+esc(message)+'</p><button class="button cloud-retry">Try again</button><button class="link cloud-settings">Account settings</button></div>';
    document.querySelectorAll('.cloud-retry').forEach(b=>b.onclick=()=>{if(client&&member)void load(client,user,member);else show('settings')});
    document.querySelectorAll('.cloud-settings').forEach(b=>b.onclick=()=>show('settings'));
  }
  async function all(table,columns){
    const out=[];
    for(let offset=0;offset<10000;offset+=500){
      const {data,error}=await client.from(table).select(columns).eq('family_id',member.family_id)
        .order('id').range(offset,offset+499);
      if(error)throw error;
      out.push(...data);
      if(data.length<500)return out;
    }
    throw Error('Dataset exceeds supported size');
  }
  function games(){
    const map=new Map();
    for(const r of rows.filter(r=>r.player_id===selected&&r.state==='published')){
      if(!map.has(r.source_key)||map.get(r.source_key).version<r.version)map.set(r.source_key,r);
    }
    return [...map.values()].sort((a,b)=>b.played_on.localeCompare(a.played_on)||a.source_key.localeCompare(b.source_key));
  }
  function currentReport(){
    return [...reports].filter(r=>r.player_id===selected&&r.published_at)
      .sort((a,b)=>b.published_at.localeCompare(a.published_at)||b.id.localeCompare(a.id))[0];
  }
  function fresh(report){
    const keys=a=>a.map(x=>x.source_key+':'+x.version).sort().join('|');
    return report&&Array.isArray(report.body?.game_versions)&&keys(report.body.game_versions)===keys(games());
  }
  function stats(g){return '<div class="stats">'+[['PTS',g.pts],['REB',g.reb],['AST',g.ast],['STL',g.stl]].map(([l,v])=>'<div><strong>'+esc(v??'—')+'</strong><span>'+l+'</span></div>').join('')+'</div>';}
  function reportSections(report){
    const b=report.body;
    const group=(title,items)=>'<div class="card"><h2>'+title+'</h2>'+(Array.isArray(items)?items:[]).map(x=>'<h3>'+esc(x.title)+'</h3><p>'+esc(x.detail)+'</p>').join('')+'</div>';
    return '<div class="card"><span class="pill">AI-assisted · prepared locally</span><h2>'+esc(b.title)+'</h2><p>'+esc(b.summary)+'</p></div>'+
      group("What's going well",b.positives)+group('Your next opportunities',b.focus)+
      '<div class="card mint"><h2>Suggested next step</h2><h3>'+esc(b.next_step?.title)+'</h3><p>'+esc(b.next_step?.detail)+'</p><p class="muted">'+esc(b.reflection_prompt)+'</p></div>'+
      '<details class="card"><summary>About this report & data notes</summary>'+(b.data_notes||[]).map(n=>'<p class="muted">'+esc(n)+'</p>').join('')+'</details>';
  }
  function list(){
    return games().map(r=>{const g=r.statistics;return '<button class="card cloud-game" data-cloud-game="'+esc(r.id)+'"><span class="kicker">'+esc(g.date)+'</span><strong>'+esc(g.importReview?.team)+' '+esc(g.ours)+' – '+esc(g.theirs)+' '+esc(g.opponent)+'</strong><span>'+esc(g.pts??'—')+' points · '+esc(g.importReview?.minutesOriginal||'—')+' played</span><span class="link">View game & team →</span></button>'}).join('')||'<div class="card">No published games for this player yet.</div>';
  }
  function wire(){document.querySelectorAll('[data-cloud-game]').forEach(b=>b.onclick=()=>detail(b.dataset.cloudGame));}
  function paint(){
    const gs=games(),latest=gs[0],g=latest?.statistics,r=currentReport(),valid=fresh(r);
    const name=g?.importReview?.player||'Your player';
    const options=[...new Map(rows.map(x=>[x.player_id,x.statistics?.importReview?.player||'Player'])).entries()];
    const chooser=member.role==='parent'&&options.length?'<label for="cloudPlayer">Player<select class="field" id="cloudPlayer">'+options.map(([id,n])=>'<option value="'+esc(id)+'"'+(id===selected?' selected':'')+'>'+esc(n)+'</option>').join('')+'</select></label>':'';
    byId('cloudHome').innerHTML='<div class="cloud-identity"><span class="pill verified">Private published records</span><h1>'+esc(name)+'</h1><p class="muted">'+esc(g?.importReview?.team||'Your team')+' · '+gs.length+' recorded games</p></div>'+chooser+
      '<div class="row"><span class="muted">Updated from your private database</span><button id="cloudRefresh" class="link">Refresh</button></div>'+
      (g?'<div class="card"><div class="row"><h2>Latest game</h2><button class="link" data-cloud-game="'+esc(latest.id)+'">View →</button></div><p>'+esc(g.date)+' · vs '+esc(g.opponent)+' · '+esc(g.ours)+'–'+esc(g.theirs)+'</p>'+stats(g)+'</div>':'<div class="card">No published games yet.</div>')+
      '<div class="card"><h2>My development</h2>'+(valid?'<span class="pill">AI-assisted review</span><p>'+esc(r.body.summary)+'</p><button class="button" id="cloudReadReport">View full report →</button>':'<p>'+(r?'Your games have changed. An updated review has not been published yet.':'Your review has not been published yet.')+'</p>')+'</div>'+
      '<div class="card"><h2>Team performance</h2>'+(g?'<p>'+esc(g.importReview?.team)+' '+esc(g.ours)+'–'+esc(g.theirs)+' '+esc(g.opponent)+'</p><p class="muted">Explore team totals and every recorded player.</p><button class="link" data-cloud-game="'+esc(latest.id)+'">Explore latest team box score →</button>':'<p>No team records yet.</p>')+'</div>';
    byId('cloudGames').innerHTML='<h1>Games</h1><p class="muted">Latest published versions. Source differences remain visible in each game.</p>'+list();
    byId('cloudTeam').innerHTML='<h1>Team & Me</h1><p class="muted">Open a game for both teams, quarter scores and player statistics.</p>'+list();
    byId('cloudReport').innerHTML='<h1>Player development report</h1><p class="muted">'+esc(valid?r.body.scope_label:'Published report status')+'</p>'+
      (valid?'<p class="muted">Prepared '+esc(r.body.generated_on)+' · Published '+esc(new Date(r.published_at).toLocaleDateString('en-AU'))+'</p>'+reportSections(r):
      '<div class="card">'+(r?'The saved review covers older game revisions. New analysis must be prepared locally and published before it appears here.':'No published review yet.')+'</div>');
    byId('cloudRefresh').onclick=()=>void load(client,user,member);
    if(byId('cloudReadReport'))byId('cloudReadReport').onclick=()=>show('progress');
    if(byId('cloudPlayer'))byId('cloudPlayer').onchange=e=>{selected=e.target.value;paint();};
    wire();
  }
  function detail(id){
    const row=games().find(r=>r.id===id);if(!row)return;
    const g=row.statistics,r=g.importReview||{},review=currentReport();
    const insight=fresh(review)?review.body.per_game?.find(x=>x.date===g.date):null;
    byId('cloudDetail').innerHTML='<button class="link" id="cloudBack">← Games</button><p class="kicker">'+esc(g.date)+'</p><h1>'+esc(r.team)+' '+esc(g.ours)+'–'+esc(g.theirs)+' '+esc(g.opponent)+'</h1><p class="muted">'+esc(r.player)+' · '+esc(r.minutesOriginal)+' played</p><div class="card">'+stats(g)+'</div>'+
      (insight?'<div class="card"><span class="pill">Published AI-assisted review</span><h2>'+esc(insight.headline)+'</h2><p>'+esc(insight.detail)+'</p></div>':'')+
      '<h2>Quarter scores</h2><div class="quarter-grid">'+(r.quarterScores||[]).map((q,i)=>'<div><span>Q'+(i+1)+'</span><strong>'+esc(q[0])+'–'+esc(q[1])+'</strong></div>').join('')+'</div><h2>Team totals</h2>'+(r.teamTotals||[]).map(teamTotalHTML).join('')+
      '<h2>Team box score</h2><p class="muted">Your row is highlighted. Swipe tables sideways to see more statistics.</p>'+[...new Set([r.team,g.opponent])].map(t=>rosterTable(r.roster||[],t,r.player)).join('')+
      '<details class="card"><summary>Source & review notes</summary><p class="muted">Transcribed values; independent source review is pending. Team totals may include team/coach statistics.</p>'+(r.issues||[]).map(n=>'<p class="muted">'+esc(n.message)+'</p>').join('')+'</details>';
    byId('cloudBack').onclick=()=>show('games');show('cloudDetail');
  }
  async function load(c,u,m){
    client=c;user=u;member=m;connected=true;const ticket=++epoch;
    try{
      const [gr,rr]=await Promise.all([all('bj_games','id,player_id,source_key,version,played_on,state,statistics'),all('bj_reports','id,player_id,body,published_at')]);
      if(ticket!==epoch)return;
      if(gr.some(r=>!r.statistics||typeof r.statistics!=='object'||!r.source_key||!Number.isInteger(r.version)))throw Error('Invalid records');
      rows=gr;reports=rr;
      selected=m.role==='player'?u.id:(rows.some(r=>r.player_id===selected)?selected:rows[0]?.player_id);
      lastLoad=Date.now();paint();
      if(!byId('settings').classList.contains('active'))show('home');
    }catch{if(ticket===epoch)fail('Published records could not be loaded. Check your connection and try again. Your device records have not been changed.');}
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&connected&&client&&member&&Date.now()-lastLoad>60000)void load(client,user,member)});
  window.familyCloud={begin,reset,load,fail};
})();
