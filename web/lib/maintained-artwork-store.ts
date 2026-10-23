import {sameEditValue} from './inline-edit';
import {env} from 'cloudflare:workers';
import {readBaseData,saveEntries} from './store';
import {applyMaintainedArtwork,maintainedArtwork} from './maintained-artwork';
import {artworkAudit} from './artwork-audit';
/** Normal collection repairs missing known originals and audits every service/language. */
export async function importMaintainedArtwork(){
 const data=await readBaseData();if(!data.persistent)throw Error('Full artwork originals unavailable');
 const changes=data.entries.map(applyMaintainedArtwork).filter((e,i)=>e!==data.entries[i]);
 if(changes.length)await saveEntries(changes);
 const saved=changes.length?await readBaseData({ids:changes.map(e=>e.id)}):{entries:[]};
 const applied=saved.entries.filter(e=>!sameEditValue(e,data.entries.find(x=>x.id===e.id))).map(e=>e.id);
 const result={checkedAt:new Date().toISOString(),registeredOriginals:maintainedArtwork.length,changedEntries:applied,preservedEntries:changes.filter(e=>!applied.includes(e.id)).map(e=>e.id),audit:artworkAudit(data.entries.map(applyMaintainedArtwork)),note:'Exact original registry fills omissions; audit is not a new source/body/HTTP success receipt.'};
 await env.DB!.prepare("INSERT INTO operations_health(key,payload) VALUES('maintained-artwork',?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload").bind(JSON.stringify(result)).run();return result;
}
