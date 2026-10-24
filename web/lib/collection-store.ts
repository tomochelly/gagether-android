import {env} from 'cloudflare:workers';
import {type ReviewDocument,sourceDocument} from './collection-review';
import type {FastNotice} from './fast-notices';
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
export async function captureDocument(n:FastNotice,html:string|undefined,checkedAt:string,error?:string){
 const id=await digest(n.gameId+'|'+n.region+'|'+n.url),old=await env.DB!.prepare('SELECT payload,body_hash,reviewed_hash,verified_at FROM official_documents WHERE id=?').bind(id).first<{payload:string;body_hash:string;reviewed_hash:string|null;verified_at:string|null}>();
 if(old&&!html&&!error&&JSON.parse(old.payload).title===n.title)return {...JSON.parse(old.payload),status:old.reviewed_hash===old.body_hash?'reviewed':'pending',verifiedAt:old.verified_at};
 const parsed=html?sourceDocument(html,n.url):{access:error?'error':'metadata',text:'',images:[]};
 const access=error?.includes('403')||error?.includes('429')?'blocked':parsed.access;
 const previous=old?JSON.parse(old.payload) as ReviewDocument:undefined;
 const text=parsed.text,hash=html&&parsed.access==='body'?await digest(n.title+'\n'+text+'\n'+parsed.images.join('\n')):previous?.title===n.title?old!.body_hash:await digest(n.title+'\nmetadata-only');
 if(hash&&hash!==old?.body_hash&&parsed.access==='body')await env.BUCKET!.put('official-documents/'+id+'/'+hash,JSON.stringify({url:n.url,title:n.title,text,images:parsed.images,links:'links' in parsed?parsed.links:[]}),{httpMetadata:{contentType:'application/json'},customMetadata:{gameId:n.gameId,region:n.region,sha256:hash}});
 const document:ReviewDocument={id,gameId:n.gameId,region:n.region,locale:n.locale,url:n.url,title:n.title,publishedAt:n.publishedAt,sourceAccess:access as ReviewDocument['sourceAccess'],bodyHash:hash,images:parsed.access==='body'?parsed.images:previous?.images||[],checkedAt,...(html!==undefined||error?{bodyCheckedAt:checkedAt}:{}),...(error?{error}:{})};
 const status=hash&&hash===old?.reviewed_hash?'reviewed':error||access==='js-only'?'unavailable':'pending';
 await env.DB!.prepare('INSERT INTO official_documents(id,game_id,region,locale,url,payload,body_hash,reviewed_hash,status,checked_at,verified_at,entry_ids) VALUES(?,?,?,?,?,?,?,NULL,?,?,NULL,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,body_hash=excluded.body_hash,status=excluded.status,checked_at=excluded.checked_at').bind(id,n.gameId,n.region,n.locale,n.url,JSON.stringify(document),hash,status,checkedAt,'[]').run();
 return {...document,status,verifiedAt:old?.verified_at||null};
}
export async function reviewQueue(limit=100){const rows=await env.DB!.prepare('SELECT payload,status,reviewed_hash,verified_at,entry_ids FROM official_documents ORDER BY CASE status WHEN \'pending\' THEN 0 WHEN \'unavailable\' THEN 1 ELSE 2 END,checked_at DESC LIMIT ?').bind(limit).all<{payload:string;status:string;reviewed_hash:string;verified_at:string;entry_ids:string}>();return rows.results.map(r=>({...JSON.parse(r.payload),status:r.status,verifiedAt:r.verified_at,entryIds:JSON.parse(r.entry_ids)}));}
