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
  const facts=order.filter(positive).slice(0,3).map(k=>g[k]+' '+labels[k]);
  const totals=g.importReview?.teamTotal;
  const shares=[];
  for(const [key,total] of [['pts',g.ours],['reb',g.teamReb],['ast',totals?.ast],['stl',totals?.stl],['fd',totals?.fd]])if(positive(key)&&typeof total==='number'&&Number.isFinite(total)&&total>=g[key]&&total>0)shares.push(g[key]+' of '+total+' team '+labels[key]+' ('+Math.round(g[key]/total*100)+'%)');
  const watch=[];
  if(typeof g.to==='number'&&Number.isFinite(g.to)&&g.to>0)watch.push(g.to+' turnovers');
  if(typeof g.pf==='number'&&Number.isFinite(g.pf)&&g.pf>0)watch.push(g.pf+' personal fouls');
  return {title,summary:facts.length?facts.join(' · '):'No positive contributions recorded in the available fields.',shares,watch,review:!!g.importReview};
}
function contributionHTML(g){const c=gameContribution(g);return '<div class="contribution"><div class="kicker">Recorded contribution</div><h3>'+esc(c.title)+'</h3><p>'+esc(c.summary)+'</p>'+(c.shares.length?'<p class="muted">'+c.shares.map(esc).join(' · ')+'</p>':'')+(c.watch.length?'<p class="contribution-watch"><strong>Next focus:</strong> '+esc(c.watch.join(' · '))+'. Review the possessions and situations behind these numbers.</p>':'')+'<small class="muted">'+(c.review?'Based on transcribed box-score values; source review is pending. ':'')+'Descriptive summary, not a player ranking or a measure of overall value.</small></div>';}
if(typeof module!=='undefined')module.exports={gameTime,gameContribution};
