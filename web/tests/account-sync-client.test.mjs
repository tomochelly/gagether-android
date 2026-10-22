import './load-typescript.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('',{url:'https://gagether.wiki',pretendToBeVisual:true});
for(const key of ['window','document','localStorage','Event','StorageEvent','navigator'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
const client=await import('../lib/account-sync-client.ts');
const {emptyProfile}=await import('../lib/account-profile.ts');
const {GAME_ORDER_KEY}=await import('../lib/game-order.ts');
const {PERSONAL_NOTES_KEY}=await import('../lib/personal-notes.ts');
const userA='a'.repeat(64),userB='b'.repeat(64);let account=userA,network=true,beforePost=null,conflictOnce=false;
const server=new Map();let posts=0;
globalThis.fetch=async(url,options={})=>{
 assert.equal(url,'/api/account/sync');if(!network)throw Error('offline');if(!account)return Response.json({}, {status:401});
 const current=server.get(account)||{accountId:account,revision:0,profile:emptyProfile()};
 if(options.method==='POST'){
  const body=JSON.parse(options.body);if(beforePost){const fn=beforePost;beforePost=null;fn();}
  if(conflictOnce){conflictOnce=false;server.set(account,{...current,revision:current.revision+1,profile:{...current.profile,saved:['remote-entry']}});return Response.json({}, {status:409});}
  if(body.accountId!==account||body.revision!==current.revision)return Response.json({}, {status:409});
  const next={accountId:account,revision:current.revision+1,profile:body.profile};server.set(account,next);posts++;return Response.json(next);
 }
 return Response.json(current);
};
const write=(profile)=>{localStorage.setItem(client.preferencesKey,JSON.stringify({locale:'ko',theme:'dark',favorites:profile.favorites,saved:profile.saved}));localStorage.setItem(GAME_ORDER_KEY,JSON.stringify({version:1,ids:profile.order}));localStorage.setItem(PERSONAL_NOTES_KEY,JSON.stringify({version:1,notes:profile.notes}));};
test('client imports guest data, keeps in-flight edits, retries CAS, isolates accounts and restores guest state',async()=>{
 const guest={...emptyProfile(),favorites:['wuwa'],order:['wuwa','zzz']};write(guest);
 await client.syncNow();assert.equal(client.syncSnapshot(),'synced');assert.deepEqual(server.get(userA).profile,guest);
 assert.equal(JSON.parse(localStorage.getItem(client.preferencesKey)).locale,'ko');
 const unchangedPosts=posts;await client.syncNow();assert.equal(posts,unchangedPosts,'unchanged reads must not write');
 // Two logical devices use independent browser storage snapshots and shared server state.
 const firstDevice=new Map(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));localStorage.clear();
 await client.syncNow();assert.deepEqual(client.readLocalProfile(),guest);
 write({...client.readLocalProfile(),favorites:['zzz']});await client.syncNow();
 localStorage.clear();for(const [key,value]of firstDevice)localStorage.setItem(key,value);
 await client.syncNow();assert.deepEqual(client.readLocalProfile().favorites,['zzz'],'old device must not resurrect wuwa');
 write({...client.readLocalProfile(),favorites:['zzz','hi3']});
 beforePost=()=>write({...client.readLocalProfile(),favorites:['zzz','hi3','trickcal']});
 await client.syncNow();assert.deepEqual(server.get(userA).profile.favorites,['hi3','trickcal','zzz']);
 write({...client.readLocalProfile(),favorites:['hi3','trickcal','zzz','wuwa']});conflictOnce=true;
 await client.syncNow();assert.equal(client.syncSnapshot(),'synced');assert.deepEqual(client.readLocalProfile().saved,['remote-entry']);assert.ok(client.readLocalProfile().favorites.includes('wuwa'));
 network=false;write({...client.readLocalProfile(),saved:['remote-entry','offline-note']});await client.syncNow();assert.equal(client.syncSnapshot(),'error');
 await assert.rejects(()=>client.prepareAccountExit(false));
 network=true;await client.syncNow();assert.ok(server.get(userA).profile.saved.includes('offline-note'));
 account=userB;await client.syncNow();assert.deepEqual(client.readLocalProfile(),emptyProfile(),'second account cannot import previous account or original guest data');
 account=userA;await client.syncNow();assert.ok(client.readLocalProfile().saved.includes('offline-note'));
 await client.prepareAccountExit(false);account=null;client.completeAccountExit(false);assert.deepEqual(client.readLocalProfile(),guest);client.cancelAccountExit();
 account=userA;await client.syncNow();assert.ok(client.readLocalProfile().saved.includes('offline-note'));
 await client.prepareAccountExit(true);server.delete(userA);account=null;client.completeAccountExit(true);client.cancelAccountExit();
 assert.equal(localStorage.getItem(client.syncStateKey+'.'+userA),null);assert.deepEqual(client.readLocalProfile(),guest);
});
test('corrupt local records are preserved and never uploaded or reported synced',async()=>{
 account=userA;localStorage.setItem(PERSONAL_NOTES_KEY,'invalid json');const before=posts;
 await client.syncNow();assert.equal(client.syncSnapshot(),'error');assert.equal(posts,before);assert.equal(localStorage.getItem(PERSONAL_NOTES_KEY),'invalid json');
});
