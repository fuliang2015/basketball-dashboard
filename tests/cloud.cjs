const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{const p=path.join(root,req.url==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',types[path.extname(p)]||'text/plain');res.end(fs.readFileSync(p))}catch{res.statusCode=404;res.end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'msedge',headless:true});try{
const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
let uid='11111111-1111-4111-8111-111111111111',fail=false,version=2,role='player';
const user=()=>({id:uid,email:'synthetic@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()});
const game=(ver)=>({id:'row-'+ver,player_id:uid,source_key:'synthetic-game',version:ver,played_on:'2026-10-31',state:'published',statistics:{id:'synthetic-game',date:'2026-10-31',opponent:'Other team',ours:40,theirs:42,pts:ver===1?2:8,reb:3,ast:1,stl:2,minutes:12,importReview:{player:uid.startsWith('1')?'Synthetic Player A':'Synthetic Player B',team:'Example team',minutesOriginal:'12:00',issues:[{kind:'review',message:'Example source discrepancy'}],quarterScores:[[10,10],[10,10],[10,10],[10,12]],teamTotals:[{team:'Example team',pts:40,reb:20,ast:6,stl:5,tov:9,pf:10},{team:'Other team',pts:42}],roster:[{name:'Synthetic Player A',team:'Example team',minutes:'12:00',number:4,pts:8,reb:3,ast:1,stl:2,tov:2,pf:2,fd:1},{name:'Synthetic Teammate',team:'Example team',minutes:'14:00',number:5,pts:10},{name:'Synthetic Opponent',team:'Other team',minutes:'10:00',pts:9}]}}});
const report=()=>({id:'report-a',player_id:uid,published_at:'2026-11-02T00:00:00Z',body:{game_versions:[{source_key:'synthetic-game',version:2}],title:'One step at a time',scope_label:'One synthetic game',generated_on:'2026-11-02',summary:'Synthetic review for this player.',positives:[{title:'Recorded contribution',detail:'Eight recorded points.'}],focus:[{title:'Review decisions',detail:'A practice suggestion.'}],next_step:{title:'Look up',detail:'Try one early pass.'},data_notes:['Synthetic data only'],per_game:[{date:'2026-10-31',headline:'A specific game review',detail:'Example explanation.'}] }});
await p.route('https://zalqutkghkumtkkguati.supabase.co/**',async route=>{
const u=new URL(route.request().url());let data,status=200;
if(u.pathname==='/auth/v1/token')data={access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_in:3600,token_type:'bearer',user:user()};
else if(u.pathname==='/auth/v1/user')data=user();
else if(u.pathname==='/auth/v1/logout')data={};
else if(u.pathname==='/rest/v1/bj_members')data={role,family_id:'family-test',user_id:uid};
else if(u.pathname==='/rest/v1/bj_games'){if(fail){status=503;data={message:'offline'}}else data=[game(1),game(version)]}
else if(u.pathname==='/rest/v1/bj_reports')data=[report()];
else throw Error('Unexpected request '+u.pathname);
await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
});
await p.goto('http://127.0.0.1:'+server.address().port);
await p.evaluate(()=>{localStorage.setItem('basketball-journey-v1',JSON.stringify({goal:'Keep my goal',challenge:'Keep my challenge',games:[],checkins:[],profileName:'Local Player'}));show('settings')});
const before=await p.evaluate(()=>localStorage.getItem('basketball-journey-v1'));
async function login(){await p.locator('#accountEmail').fill('synthetic@example.invalid');await p.locator('#accountPassword').fill('Only-used-in-mock');await p.locator('#accountSignIn').click();await p.waitForFunction(()=>document.querySelector('#cloudHome h1')?.textContent?.includes('Synthetic Player'));}
await login();await p.locator('[data-tab=home]').click();assert((await p.locator('#cloudHome').innerText()).includes('1 recorded games'));assert((await p.locator('#cloudHome').innerText()).includes('8'));assert(!await p.locator('#cloudPlayer').count());
await p.screenshot({path:path.join(out,'cloud-home-mobile.png')});
await p.locator('#cloudReadReport').click();assert(await p.locator('#cloudReport').isVisible());assert((await p.locator('#cloudReport').innerText()).includes('Try one early pass.'));
await p.locator('[data-tab=games]').click();await p.locator('#cloudGames [data-cloud-game]').click();
assert((await p.locator('#cloudDetail').innerText()).includes('Synthetic Teammate'));
assert((await p.locator('#cloudDetail').innerText()).includes('Synthetic Opponent'));
assert((await p.locator('#cloudDetail').innerText()).includes('A specific game review'));
assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await p.screenshot({path:path.join(out,'cloud-team-mobile.png')});
await p.locator('[data-tab=home]').click();version=3;await p.locator('#cloudRefresh').click();await p.waitForFunction(()=>document.querySelector('#cloudHome').textContent.includes('updated review has not'));
assert.equal(await p.locator('#cloudReadReport').count(),0);
await p.locator('[data-tab=progress]').click();assert(!(await p.locator('#cloudReport').innerText()).includes('Try one early pass.'));
await p.locator('[data-tab=home]').click();fail=true;await p.locator('#cloudRefresh').click();await p.waitForFunction(()=>document.querySelector('#cloudHome').textContent.includes('could not be loaded'));assert(!(await p.locator('#cloudHome').innerText()).includes('Synthetic Player A'));
await p.evaluate(()=>show('settings'));await p.locator('#accountSignOut').click();await p.waitForFunction(()=>!document.getElementById('accountForm').hidden);
assert.equal(await p.locator('#cloudHome').innerText(),'');assert.equal(await p.evaluate(()=>localStorage.getItem('basketball-journey-v1')),before);
uid='22222222-2222-4222-8222-222222222222';role='parent';fail=false;version=2;await login();await p.locator('[data-tab=home]').click();assert((await p.locator('#cloudHome').innerText()).includes('Synthetic Player B'));assert(!(await p.locator('#cloudHome').innerText()).includes('Synthetic Player A'));
await p.setViewportSize({width:1280,height:900});await p.screenshot({path:path.join(out,'cloud-home-desktop.png')});
assert.deepEqual(errors,[]);console.log('PASS cloud: latest revision dedup, user context, saved report, stale report withheld, roster drilldown, errors clear old data, logout/account switch isolation, local preservation, mobile/desktop.');
}finally{await b.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exit(1)});
