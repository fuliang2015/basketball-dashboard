'use strict';
// Presentation only: never mutate recorded statistics or infer a player ranking.
function gameTime(g){
  if(typeof g.minutes!=='number'||!Number.isFinite(g.minutes)||g.minutes<0)return '—';
  const seconds=Math.round(g.minutes*60);
  return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
}
function gameContribution(g){
  const positive=k=>typeof g[k]==='number'&&Number.isFinite(g[k])&&g[k]>0;
  let title='Recorded contributions';
  if(positive('fd')&&g.fd>=3)title='Drawing fouls';
  else if(positive('ast')&&g.ast>=2&&g.pts===0)title='Creating for teammates';
  else if(positive('pts'))title='Scoring contribution';
  else if(positive('stl'))title='Defensive activity';
  else if(positive('reb'))title='Rebounding contribution';
  const order=title==='Drawing fouls'?['fd','stl','pts','ast','reb']:title==='Creating for teammates'?['ast','stl','reb','fd','pts']:['pts','reb','stl','ast','fd'];
  const labels={pts:'points',reb:'rebounds',stl:'steals',ast:'assists',fd:'fouls drawn'};
  const singular={pts:'point',reb:'rebound',stl:'steal',ast:'assist',fd:'foul drawn'};
  const facts=order.filter(positive).slice(0,3).map(k=>g[k]+' '+(g[k]===1?singular[k]:labels[k]));
  const totals=g.importReview?.teamTotal;
  const shares=[];
  for(const [key,total] of [['pts',g.ours],['reb',g.teamReb],['ast',totals?.ast],['stl',totals?.stl],['fd',totals?.fd]])if(positive(key)&&typeof total==='number'&&Number.isFinite(total)&&total>=g[key]&&total>0)shares.push(g[key]+' of '+total+' team '+labels[key]+' ('+Math.round(g[key]/total*100)+'%)');
  const watch=[];
  if(typeof g.to==='number'&&Number.isFinite(g.to)&&g.to>0)watch.push(g.to+' turnovers');
  if(typeof g.pf==='number'&&Number.isFinite(g.pf)&&g.pf>0)watch.push(g.pf+' personal fouls');
  return {title,summary:facts.length?facts.join(' · '):'No positive contributions recorded in the available fields.',shares,watch,review:!!g.importReview};
}
function contributionHTML(g){const c=gameContribution(g);return '<div class="contribution"><div class="kicker">Recorded contribution</div><h3>'+esc(c.title)+'</h3><p>'+esc(c.summary)+'</p>'+(c.shares.length?'<p class="muted">'+c.shares.map(esc).join(' · ')+'</p>':'')+(c.watch.length?'<div class="contribution-watch"><strong>Review prompts:</strong> '+esc(c.watch.join(' · '))+'<details class="practice-tips"><summary>What do these mean? Practice tips</summary><p>These are recorded events in this game, not targets for the next game. The box score does not identify the cause.</p><ul>'+(g.to>0?'<li><strong>Ball security:</strong> Rewatch each turnover: was it a pass, dribble, footwork or communication issue? In practice, try a short 2-on-1 passing drill: scan before receiving, pivot to create a passing lane and use a clear pass.</li>':'')+(g.pf>0?'<li><strong>Foul discipline:</strong> Rewatch the foul situations: was the player late, reaching, making contact or contesting a shot? Try a controlled closeout drill: arrive balanced, move the feet and keep hands disciplined. Ask the coach which situations to focus on.</li>':'')+'</ul></details></div>':'')+'</div>';}
if(typeof module!=='undefined')module.exports={gameTime,gameContribution};
