import {emptyProfile,equal,mergeProfile,parseProfile,type AccountProfile} from './account-profile';
import {PERSONAL_NOTES_KEY,decodeNotes} from './personal-notes';
import {GAME_ORDER_KEY} from './game-order';
import {PERSONAL_APPLIED,PERSONAL_CHANGED} from './personal-storage-events';
export const preferencesKey='patchwork.preferences';
export const syncStateKey='gagether.account-sync.v1';
const cacheKey=(id:string)=>syncStateKey+'.'+id;
type State={version:1;owner:string|null;guest:AccountProfile|null;importedBy:string|null};
type Cache={base:AccountProfile|null;local:AccountProfile;revision:number};
type Remote={accountId:string;revision:number;profile:AccountProfile};
export type SyncStatus='checking'|'guest'|'syncing'|'synced'|'offline'|'error';
let status:SyncStatus='checking',refs=0,timer:ReturnType<typeof setInterval>|undefined,debounce:ReturnType<typeof setTimeout>|undefined,inflight:Promise<void>|undefined,stopping=false;
const listeners=new Set<()=>void>();
export const subscribeSync=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export const syncSnapshot=()=>status;
function setStatus(next:SyncStatus){if(status!==next){status=next;listeners.forEach(fn=>fn());}}
function readState():State{
 const raw=localStorage.getItem(syncStateKey);if(!raw)return {version:1,owner:null,guest:null,importedBy:null};
 const s=JSON.parse(raw) as State;if(s.version!==1||s.owner!==null&&!/^[a-f0-9]{64}$/.test(s.owner)||s.importedBy!==null&&!/^[a-f0-9]{64}$/.test(s.importedBy))throw Error('Invalid sync state');
 if(s.guest)s.guest=parseProfile(s.guest);return s;
}
function writeState(s:State){localStorage.setItem(syncStateKey,JSON.stringify(s));}
function readCache(id:string):Cache|null{
 const raw=localStorage.getItem(cacheKey(id));if(!raw)return null;const c=JSON.parse(raw) as Cache;
 if(!Number.isSafeInteger(c.revision)||c.revision<0)throw Error('Invalid sync cache');
 return {base:c.base===null?null:parseProfile(c.base),local:parseProfile(c.local),revision:c.revision};
}
function writeCache(id:string,c:Cache){localStorage.setItem(cacheKey(id),JSON.stringify(c));}
export function readLocalProfile():AccountProfile{
 const p=JSON.parse(localStorage.getItem(preferencesKey)||'{}');if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid preferences');
 const rawOrder=localStorage.getItem(GAME_ORDER_KEY),o=rawOrder?JSON.parse(rawOrder):null;
 if(o&&(o.version!==1||!Array.isArray(o.ids)))throw Error('Invalid game order');
 return parseProfile({favorites:p.favorites??[],saved:p.saved??[],order:o?.ids??[],notes:decodeNotes(localStorage.getItem(PERSONAL_NOTES_KEY))});
}
function applyLocal(p:AccountProfile){
 const keys=[preferencesKey,GAME_ORDER_KEY,PERSONAL_NOTES_KEY],previous=keys.map(k=>localStorage.getItem(k));
 const preferences=JSON.parse(previous[0]||'{}');
 try{
  localStorage.setItem(preferencesKey,JSON.stringify({...preferences,favorites:p.favorites,saved:p.saved}));
  localStorage.setItem(GAME_ORDER_KEY,JSON.stringify({version:1,ids:p.order}));
  localStorage.setItem(PERSONAL_NOTES_KEY,JSON.stringify({version:1,notes:p.notes}));
 }catch(e){keys.forEach((k,i)=>{try{previous[i]===null?localStorage.removeItem(k):localStorage.setItem(k,previous[i]!);}catch{}});throw e;}
 window.dispatchEvent(new Event(PERSONAL_APPLIED));
}
function capture(){
 const s=readState();if(!s.owner)return;
 const c=readCache(s.owner);if(!c)throw Error('Missing account cache');
 const local=readLocalProfile();if(!equal(c.local,local))writeCache(s.owner,{...c,local});
}
function detach(remove=false){
 const s=readState();if(!s.owner)return;capture();const old=s.owner;
 // Keep pending edits account-scoped on session expiry; never import them into another account.
 writeState({...s,owner:null});try{applyLocal(s.guest||emptyProfile());}catch(e){writeState(s);throw e;}
 if(remove)localStorage.removeItem(cacheKey(old));
 window.dispatchEvent(new Event('gagether:account-changed'));
}
function attach(id:string){
 const s=readState();if(s.owner===id)return;
 if(s.owner)detach();
 const next=readState(),guest=readLocalProfile(),cached=readCache(id);
 next.guest=guest;
 const local=cached?.local||(!next.importedBy?guest:emptyProfile());
 const c=cached||{base:null,local,revision:0};
 writeCache(id,c);next.owner=id;next.importedBy=next.importedBy||id;
 // Persist a recoverable owner marker before copying its profile into the working keys.
 writeState(next);try{applyLocal(c.local);}catch(e){writeState({...next,owner:null});throw e;}window.dispatchEvent(new Event('gagether:account-changed'));
}
async function request(method:'GET'|'POST',body?:unknown){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{return await fetch('/api/account/sync',{method,cache:'no-store',credentials:'same-origin',signal:controller.signal,headers:{'X-Gagether-Auth':'1',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});}finally{clearTimeout(timeout);}
}
function remoteValue(v:unknown):Remote{
 const r=v as Remote;if(!r||!/^[a-f0-9]{64}$/.test(r.accountId)||!Number.isSafeInteger(r.revision)||r.revision<0)throw Error('Invalid sync response');return {...r,profile:parseProfile(r.profile)};
}
async function cycle(){
 if(stopping)return;
 try{
  capture();
  if(navigator.onLine===false){setStatus('offline');return;}
  setStatus('syncing');
  for(let attempt=0;attempt<4;attempt++){
   const response=await request('GET');
   if(response.status===401){detach();setStatus('guest');return;}
   if(!response.ok)throw Error('Sync unavailable');
   const remote=remoteValue(await response.json());attach(remote.accountId);capture();
   const c=readCache(remote.accountId)!;
   const sent=mergeProfile(c.base,c.local,remote.profile);
   let acknowledged=remote;
   if(!equal(sent,remote.profile)){
    const saved=await request('POST',{accountId:remote.accountId,revision:remote.revision,profile:sent});
    if(saved.status===409)continue;
    if(saved.status===401){detach();setStatus('guest');return;}
    if(!saved.ok)throw Error('Could not save profile');
    acknowledged=remoteValue(await saved.json());
    if(acknowledged.accountId!==remote.accountId)throw Error('Account changed');
   }
   // A click while the request was in flight is a new delta, not an obsolete snapshot.
   if(readState().owner!==remote.accountId)continue;
   capture();const latest=readCache(remote.accountId)!;
   const local=mergeProfile(c.local,latest.local,acknowledged.profile);
   applyLocal(local);
   writeCache(remote.accountId,{base:acknowledged.profile,local,revision:acknowledged.revision});
   if(!equal(local,acknowledged.profile))continue;
   setStatus('synced');return;
  }
  throw Error('Concurrent changes; retry');
 }catch{setStatus(navigator.onLine===false?'offline':'error');}
}
export function syncNow():Promise<void>{
 if(inflight)return inflight;
 const run=()=>cycle();
 // Serialize tabs on supporting browsers; server revision checks remain authoritative.
 const pending=(async()=>{if(navigator.locks)await navigator.locks.request('gagether-account-sync',run);else await run();})();
 inflight=pending.finally(()=>{inflight=undefined;});return inflight;
}
function changed(){try{capture();setStatus(readState().owner?'syncing':'guest');}catch{setStatus('error');return;}clearTimeout(debounce);debounce=setTimeout(()=>void syncNow(),500);}
function storage(e:StorageEvent){
 if([preferencesKey,GAME_ORDER_KEY,PERSONAL_NOTES_KEY,syncStateKey].includes(e.key||'')){
  window.dispatchEvent(new Event(PERSONAL_APPLIED));clearTimeout(debounce);debounce=setTimeout(()=>void syncNow(),500);
 }
}
function resume(){if(!document.hidden)void syncNow();}
export function startAccountSync(){
 if(++refs===1){stopping=false;window.addEventListener(PERSONAL_CHANGED,changed);window.addEventListener('storage',storage);window.addEventListener('online',resume);document.addEventListener('visibilitychange',resume);timer=setInterval(resume,15000);void syncNow();}
 return()=>{if(--refs===0){clearInterval(timer);clearTimeout(debounce);window.removeEventListener(PERSONAL_CHANGED,changed);window.removeEventListener('storage',storage);window.removeEventListener('online',resume);document.removeEventListener('visibilitychange',resume);}};
}
/** Logout waits for pending writes. Deletion deliberately discards this account's local cache. */
export async function prepareAccountExit(remove:boolean){
 clearTimeout(debounce);if(inflight)await inflight;
 if(!remove){await syncNow();if(status!=='synced'&&status!=='guest')throw Error('Save pending changes before signing out');}
 stopping=true;
}
export function completeAccountExit(remove:boolean){detach(remove);setStatus('guest');}
export function cancelAccountExit(){stopping=false;}
