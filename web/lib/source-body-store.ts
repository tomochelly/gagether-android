import {env} from 'cloudflare:workers';
import {readData,readBaseData,saveEntries} from './store';
import {reviewQueue} from './collection-store';
import {bodyFromDocument,importBody} from './source-bodies';
import {effectiveRegion} from './presentation';
import {games} from './games';
import type {Entry} from './types';
/** Publish readable source material. Import receipts are separate from human review. */
export async function importCapturedBodies(ids?:string[],limit=20){
 const queue=(await reviewQueue(5000)).filter(d=>d.sourceAccess==='body'&&(!ids||ids.includes(d.id)));
 const catalog=await readData({automatic:true,collection:true});if(!catalog.persistent)throw Error('Current catalog unavailable');
 const receiptRows=await env.DB!.prepare("SELECT key,payload FROM operations_health WHERE key LIKE 'body-import:%'").all<{key:string;payload:string}>(),receipts=new Map(receiptRows.results.map(r=>[r.key,r.payload]));
 const candidates=queue.map(d=>{const matches=catalog.entries.filter(e=>e.gameId===d.gameId&&effectiveRegion(games.find(g=>g.id===e.gameId)!,e.region)===effectiveRegion(games.find(g=>g.id===d.gameId)!,d.region)&&[e.sourceUrl,...Object.values(e.localizationSources||{})].includes(d.url));return {d,matches,receipt:JSON.stringify({hash:d.bodyHash,entries:matches.map(e=>e.id).sort()})};}).filter(x=>x.matches.length&&(ids||receipts.get('body-import:'+x.d.id)!==x.receipt)).slice(0,ids?25:Math.min(100,limit));
 if(!candidates.length)return {importedDocuments:0,unchangedDocuments:0,changedEntries:[]};
 const originals=await readBaseData({ids:[...new Set(candidates.flatMap(x=>x.matches.map(e=>e.id)))]});if(!originals.persistent)throw Error('Saved details unavailable');
 const entries=new Map(originals.entries.map(e=>[e.id,e])),changed=new Map<string,Entry>(),completed:typeof candidates=[];let imported=0,unchanged=0;
 for(const item of candidates){const {d,matches}=item,object=await env.BUCKET!.get('official-documents/'+d.id+'/'+d.bodyHash);if(!object)continue;const body=bodyFromDocument(d,await object.json());if(!body)continue;let applied=false;
  for(const m of matches){const old=entries.get(m.id);if(!old)continue;const next=importBody(old,body);if(next!==old){entries.set(m.id,next);changed.set(m.id,next);applied=true;}}
  applied?imported++:unchanged++;completed.push(item);
 }
 const list=[...changed.values()];for(let i=0;i<list.length;i+=10)await saveEntries(list.slice(i,i+10));
 const readback=list.length?(await readBaseData({ids:list.map(e=>e.id)})).entries:[];
 if(list.some(e=>JSON.stringify(e.sourceBodies)!==JSON.stringify(readback.find(x=>x.id===e.id)?.sourceBodies)))throw Error('Imported body readback failed');
 for(const {d,receipt} of completed)await env.DB!.prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload').bind('body-import:'+d.id,receipt).run();
 return {importedDocuments:imported,unchangedDocuments:unchanged,changedEntries:list.map(e=>e.id)};
}
