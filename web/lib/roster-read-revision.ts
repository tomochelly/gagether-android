import {env} from 'cloudflare:workers';
import {games} from './games';
import modelVersions from '../content/public-read-versions.json' with {type:'json'};
declare const __PATCHWORK_BUILD__:string;
type Row={key:string;revision:string};
const sourceKey=(gameId:string)=>'character-roster:'+gameId;
/** Opaque public-read revision. Source bytes still undergo full validation on every 200 read. */
export async function rosterReadRevision(gameId:string,pointer:string|undefined,frames:{key:string;revision:number}[]){
 const rows:Row[]=[...pointer?[{key:sourceKey(gameId),revision:pointer}]:[],...frames.map(r=>({key:r.key,revision:String(r.revision)}))];
 return revision(gameId,rows);
}
async function revision(gameId:string,rows:Row[]){
 const build=(modelVersions.rosters as Record<string,string>)[gameId]||(typeof __PATCHWORK_BUILD__==='string'?__PATCHWORK_BUILD__:'test');
 rows.sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
 const bytes=new TextEncoder().encode(JSON.stringify([build,gameId,rows]));
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
/** One fresh SQL snapshot; no timers, source-body reads or shared request promises. */
export async function currentRosterReadRevision(gameId:string){
 if(!games.some(g=>g.id===gameId&&g.id!=='wuwa'))return null;
 return currentRevision(gameId,sourceKey(gameId));
}
export async function currentWuwaReadRevision(){return currentRevision('wuwa','wuwa-reference:current');}
async function currentRevision(gameId:string,key:string){
 try{
  const result=await env.DB!.prepare("SELECT key,payload AS revision FROM operations_health WHERE key=? UNION ALL SELECT key,CAST(revision AS TEXT) AS revision FROM editorial WHERE key>=? AND key<? ORDER BY key").bind(key,'roster-art:'+gameId+':','roster-art:'+gameId+':\uffff').all<Row>();
  if(!Array.isArray(result.results))return null;const source=result.results.find(r=>r.key===key);
  if(source&&!/^[a-f0-9]{64}$/.test(JSON.parse(source.revision)?.hash))return null;
  return await revision(gameId,result.results);
 }catch{return null;}
}
