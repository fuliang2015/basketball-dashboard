const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..'), out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{let p=path.join(root,req.url==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.png')?'image/png':'application/octet-stream');res.end(fs.readFileSync(p))}catch{res.statusCode=404;res.end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{
const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
let role='parent',fail=false,calls=[],uid='11111111-1111-4111-8111-111111111111';
const user=()=>({id:uid,email:'synthetic@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()});
await page.route('https://zalqutkghkumtkkguati.supabase.co/**',async route=>{
const req=route.request(), url=new URL(req.url());calls.push({path:url.pathname,body:req.postData()});
let data,status=200;
if(url.pathname==='/auth/v1/token'){if(fail){status=400;data={error:'invalid_grant',error_description:'Invalid login credentials'}}else data={access_token:'synthetic-token',refresh_token:'synthetic-refresh',expires_in:3600,token_type:'bearer',user:user()}}
else if(url.pathname==='/auth/v1/user')data=user();
else if(url.pathname==='/auth/v1/logout')data={};
else if(url.pathname==='/rest/v1/bj_members')data=role?{role}:null;
else throw Error('Unexpected cloud request '+url.pathname);
await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
});
await page.goto('http://127.0.0.1:'+server.address().port);
assert.equal(await page.title(),'Basketball Journey');
await page.evaluate(()=>{localStorage.setItem('basketball-auth-test-marker','preserve');show('settings')});
await page.waitForFunction(()=>document.getElementById('accountStatus').textContent.includes('Not signed in'));
const localBefore=await page.evaluate(()=>localStorage.getItem('basketball-journey-v1'));
async function login(){await page.locator('#accountEmail').fill('synthetic@example.invalid');await page.locator('#accountPassword').fill('Synthetic-only-password');await page.locator('#accountSignIn').click();}
fail=true;await login();await page.waitForFunction(()=>document.getElementById('accountStatus').textContent.includes('Sign-in failed'));
assert.equal(await page.locator('#accountPassword').inputValue(),'');
fail=false;await login();await page.waitForFunction(()=>document.getElementById('accountRole').textContent==='Parent / administrator');
await page.screenshot({path:path.join(out,'account-parent-mobile.png')});
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.reload();await page.evaluate(()=>show('settings'));await page.waitForFunction(()=>document.getElementById('accountRole').textContent==='Parent / administrator');
await page.locator('#accountSignOut').click();await page.waitForFunction(()=>!document.getElementById('accountForm').hidden);
assert.equal(await page.evaluate(()=>sessionStorage.getItem('basketball-family-auth-v1')),null);
role='player';await login();await page.waitForFunction(()=>document.getElementById('accountRole').textContent==='Player');
await page.setViewportSize({width:1280,height:900});await page.screenshot({path:path.join(out,'account-player-desktop.png')});
await page.locator('#accountSignOut').click();await page.waitForFunction(()=>!document.getElementById('accountForm').hidden);
role=null;await login();await page.waitForFunction(()=>document.getElementById('accountStatus').textContent.includes('has not been set up'));
assert.equal(await page.locator('#accountRole').textContent(),'');
assert.equal(await page.evaluate(()=>localStorage.getItem('basketball-journey-v1')),localBefore);
assert.equal(await page.evaluate(()=>localStorage.getItem('basketball-auth-test-marker')),'preserve');
assert.deepEqual(errors,[]);
assert(calls.every(c=>!c.body||!c.body.includes('games')));
console.log('PASS account: failed login, password cleared, parent/player role verification, reload session, sign-out, unprovisioned user, no local data upload, local preservation, mobile/desktop.');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exit(1)});


