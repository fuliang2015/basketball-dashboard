"use strict";
// First impressions are separate from post-stat reflections and never change a challenge.
const feelingChoices=['Great','Good','Mixed','Tough'];
const feelingDialog=document.createElement('dialog');
feelingDialog.id='feelingDialog';
feelingDialog.setAttribute('aria-labelledby','feelingTitle');
document.body.append(feelingDialog);
let feelingGame=null;
function persistFeeling(next){try{localStorage.setItem(KEY,JSON.stringify(next));state=next;return true;}catch{document.getElementById('feelingError').textContent='Could not save on this device. Please free storage and try again.';return false;}}
function openFeeling(id){
 const g=state.games.find(g=>g.id===id);if(!g)return;
 feelingGame=id;const old=(state.gameFeelings||[]).find(f=>f.gameId===id);
 feelingDialog.innerHTML='<form id="feelingForm"><p class="kicker">Your first impression</p><h2 id="feelingTitle" tabindex="-1">Before you check your stats…</h2><p>'+esc(g.date)+' · vs '+esc(g.opponent)+'</p><fieldset><legend>How did you feel about this game?</legend><div class="feeling-options">'+feelingChoices.map((v,i)=>'<label><input type="radio" name="feeling" value="'+v+'"'+(old?.mood===v?' checked':'')+'><span>'+['😊','🙂','😐','😔'][i]+' '+v+'</span></label>').join('')+'</div></fieldset><details><summary>Add a thought (optional)</summary><label for="feelingNote">Your thought</label><textarea id="feelingNote" class="field" maxlength="500">'+esc(old?.note||'')+'</textarea></details><p class="muted">Your feeling, not a performance score. Saved only on this device.</p><p id="feelingError" role="alert"></p><button class="button" id="saveFeeling" type="submit" '+(old?.mood?'':'disabled')+'>Save &amp; view game</button><button class="link" id="skipFeeling" type="button">Skip &amp; view game</button></form>';
 document.getElementById('feelingForm').onchange=()=>document.getElementById('saveFeeling').disabled=!feelingDialog.querySelector('input:checked');
 document.getElementById('feelingForm').onsubmit=e=>{e.preventDefault();const mood=feelingDialog.querySelector('input:checked')?.value;if(!feelingChoices.includes(mood))return;const entry={gameId:id,mood,note:document.getElementById('feelingNote').value.trim(),challenge:old?.challenge??state.challenge,at:old?.at||new Date().toISOString(),updatedAt:new Date().toISOString()};if(persistFeeling({...state,gameFeelings:[...(state.gameFeelings||[]).filter(f=>f.gameId!==id),entry]}))finishFeeling();};
 document.getElementById('skipFeeling').onclick=finishFeeling;
 if(!feelingDialog.open)feelingDialog.showModal();
 document.getElementById('feelingTitle').focus();
}
function finishFeeling(){feelingDialog.close();openGameDetail(feelingGame,'home');}
feelingDialog.addEventListener('cancel',e=>{e.preventDefault();finishFeeling();});
const beforeFeelingsRender=render;
render=function(){
 beforeFeelingsRender();
 const g=state.games.find(g=>g.id===selectedGameId);
 if(g){const f=(state.gameFeelings||[]).find(f=>f.gameId===g.id);const card=document.createElement('div');card.className='card first-impression';card.innerHTML='<h2>My first impression</h2>'+(f?'<p><strong>'+esc(f.mood)+'</strong> · Saved on this device</p>'+(f.note?'<p>'+esc(f.note)+'</p>':'')+'<p class="muted">Focus at the time: '+esc(f.challenge)+'</p>':'<p class="muted">No feeling recorded. You can add one any time.</p>')+'<button class="link" id="editFeeling">'+(f?'Edit feeling':'Add a feeling')+'</button>';detailScreen.querySelector('.row').after(card);document.getElementById('editFeeling').onclick=()=>openFeeling(g.id);}
 const seen=new Set(state.feelingSeen||[]),fresh=state.games.filter(g=>!seen.has(g.id));
 if(!fresh.length)return;
 // Mark the entire batch seen: one prompt only, never one per historical record.
 const next={...state,feelingSeen:[...new Set([...seen,...fresh.map(g=>g.id)])]};
 try{localStorage.setItem(KEY,JSON.stringify(next));state=next;}catch{return;}
 const newest=[...state.games].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id))[0];
 if(!feelingDialog.open&&fresh.some(g=>g.id===newest.id)&&!(state.gameFeelings||[]).some(f=>f.gameId===newest.id)&&!state.checkins.some(c=>c.gameId===newest.id))openFeeling(newest.id);
};
render();
