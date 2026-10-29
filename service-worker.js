const CACHE='basketball-journey-v2.5.1';
const ASSETS=['./','./index.html','./app.js','./upgrade.js','./upgrade.css','./court.svg','./mountain.png','./portrait.png','./tactics.png','./team.png','./icons.svg','./reference-layout.js','./game-import.js','./insights.js','./game-detail.js','./development.js','./feelings.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
// Wait for old tabs to close before activation to avoid mixed app versions.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('basketball-journey-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request,{ignoreSearch:true}))||fetch(event.request)))});

