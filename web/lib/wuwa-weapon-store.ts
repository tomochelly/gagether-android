import {env} from 'cloudflare:workers';
import {reviewQueue} from './collection-store';
import {readBaseData,saveEntries,saveEntryChanges} from './store';
import {bodyFromDocument} from './source-bodies';
import {applyWuwaWeapons} from './wuwa-weapons';
/** Runs on every normal collection, independently of headline/body import receipts. */
export async function importWuwaWeapons(ids?:string[]){
 const queue=(await reviewQueue(5000)).filter(d=>d.gameId==='wuwa'&&d.region==='global'&&d.sourceAccess==='body'&&(!ids||ids.includes(d.id))).sort((a,b)=>Number(b.locale==='ko')-Number(a.locale==='ko')||(b.publishedAt||'').localeCompare(a.publishedAt||'')).slice(0,40);
 const stored=await readBaseData({gameId:'wuwa'});if(!stored.persistent)throw Error('Weapon originals unavailable');
 const all=new Map(stored.entries.map(e=>[e.id,e])),changed=new Map<string,import('./types').Entry>(),issues:string[]=[];
 for(const d of queue){const object=await env.BUCKET!.get('official-documents/'+d.id+'/'+d.bodyHash);if(!object)continue;const body=bodyFromDocument(d,await object.json());if(!body)continue;
  try{const result=applyWuwaWeapons([...all.values()],body,d.publishedAt);issues.push(...result.issues);for(const e of result.entries){all.set(e.id,e);changed.set(e.id,e);}}catch(e){issues.push(d.url+': '+(e instanceof Error?e.message:'Weapon parser failed'));}
 }
 if(changed.size){await saveEntryChanges([...changed.values()].map(after=>({before:stored.entries.find(e=>e.id===after.id),after})));const check=await readBaseData({ids:[...changed.keys()]});if(!check.persistent||[...changed.values()].some(e=>{const r=check.entries.find(x=>x.id===e.id);return !r||r.startAt!==e.startAt||r.endAt!==e.endAt||JSON.stringify(r.signatureWeapons)!==JSON.stringify(e.signatureWeapons);}))throw Error('Weapon application readback failed');}
 const result={checkedAt:new Date().toISOString(),documents:queue.length,changedEntries:[...changed.keys()],issues:[...new Set(issues)]};
 await env.DB!.prepare("INSERT INTO operations_health(key,payload) VALUES('wuwa-weapons',?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload").bind(JSON.stringify(result)).run();return result;
}
