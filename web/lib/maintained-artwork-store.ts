import {sameEditValue} from './inline-edit';
import {env} from 'cloudflare:workers';
import {readBaseData,saveEntries,saveEntryChanges} from './store';
import {applyMaintainedArtwork,maintainedArtwork} from './maintained-artwork';
import {artworkAudit} from './artwork-audit';
/** Normal collection repairs missing known originals and audits every service/language. */
export async function importMaintainedArtwork(gameId?:string){
 const data=await readBaseData({gameId});if(!data.persistent)throw Error('Full artwork originals unavailable');
 const changes=data.entries.map(applyMaintainedArtwork).filter((e,i)=>e!==data.entries[i]);
 if(changes.length)await saveEntryChanges(changes.map(after=>({before:data.entries.find(e=>e.id===after.id),after})));
 const saved=changes.length?await readBaseData({ids:changes.map(e=>e.id)}):{entries:[]};
 const applied=saved.entries.filter(e=>!sameEditValue(e,data.entries.find(x=>x.id===e.id))).map(e=>e.id);
 const result={checkedAt:new Date().toISOString(),registeredOriginals:maintainedArtwork.length,changedEntries:applied,preservedEntries:changes.filter(e=>!applied.includes(e.id)).map(e=>e.id),audit:artworkAudit(data.entries.map(applyMaintainedArtwork)),note:'Exact original registry fills omissions; audit is not a new source/body/HTTP success receipt.'};
 await env.DB!.prepare("INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload").bind(gameId?'maintained-artwork:'+gameId:'maintained-artwork',JSON.stringify(result)).run();return result;
}
