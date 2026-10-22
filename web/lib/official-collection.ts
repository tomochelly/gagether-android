import {env} from 'cloudflare:workers';
import {regionalOfficialSources,regionalDetail,type RegionalNotice} from './regional-notices';
import {noticeEntry,type FastNotice} from './fast-notices';
import {retryFetch} from './retry-fetch';
import {readData,saveEntries} from './store';
import {captureDocument,reviewQueue} from './collection-store';
import {collectionCoverage,pickupNotice} from './collection-review';
const fetcher=((url:RequestInfo|URL,init?:RequestInit)=>retryFetch(typeof url==='string'?url:url instanceof URL?url.href:url.url,init)) as typeof fetch;
export async function collectRegionalNotices(){
 const before=await readData({automatic:true}),known=new Set(before.entries.map(e=>e.sourceUrl));
 const notices:RegionalNotice[]=[],inspected:{notice:RegionalNotice;checkedAt:string}[]=[],checks:any[]=[];
 for(let offset=0;offset<regionalOfficialSources.length;offset+=3)await Promise.all(regionalOfficialSources.slice(offset,offset+3).map(async source=>{
  const checkedAt=new Date().toISOString();try{
   const rows=await source.load(fetcher);if(!rows.length)throw Error('HTTP 200 without readable official notices');
   const fresh=rows.filter(n=>!known.has(n.url));for(const n of fresh){known.add(n.url);notices.push(n);}
   // Index success is explicitly separate from body review and pickup application.
   checks.push({source:source.key,gameId:source.gameId,region:source.region,locale:source.locale,url:source.url,checkedAt,status:'ok',count:rows.length,added:fresh.length});
   for(const n of rows.slice(0,12))inspected.push({notice:n,checkedAt});
  }catch(e){checks.push({source:source.key,gameId:source.gameId,region:source.region,locale:source.locale,url:source.url,checkedAt,status:'error',error:e instanceof Error?e.message:'Source unavailable'});}
 }));
 if(notices.length){await saveEntries(notices.map(n=>noticeEntry(n,new Date().toISOString())));const readback=await readData({automatic:true});if(notices.some(n=>!readback.entries.some(e=>e.sourceUrl===n.url)))throw Error('Regional notice readback failed');}
 for(const {notice,checkedAt} of inspected)await captureDocument(notice,notice.bodyHtml,checkedAt);
 return {checks,added:notices.length};
}
export async function collectPendingDocuments(){
 const data=await readData({automatic:true}),queue=await reviewQueue(5000),previous=new Map(queue.map(d=>[d.url,d]));
 const candidates=data.entries.filter(e=>(e.id.startsWith('quick-')||e.id.startsWith('feed-'))&&(e.sourceKind||'official')==='official').sort((a,b)=>Number(pickupNotice(b.sourceTitle))-Number(pickupNotice(a.sourceTitle))||(b.publishedAt||'').localeCompare(a.publishedAt||''));
 const unique=[...new Map(candidates.map(e=>[e.sourceUrl,e])).values()];
 const chosen=unique.filter(e=>{const old=previous.get(e.sourceUrl);return !old||old.sourceAccess==='metadata'||old.status!=='reviewed'&&Date.now()-Date.parse(old.checkedAt)>60*60000;}).sort((a,b)=>Number(pickupNotice(b.sourceTitle))-Number(pickupNotice(a.sourceTitle))||(Date.parse(previous.get(a.sourceUrl)?.checkedAt||'')||0)-(Date.parse(previous.get(b.sourceUrl)?.checkedAt||'')||0)||(b.publishedAt||'').localeCompare(a.publishedAt||'')).slice(0,10);
 const checks:any[]=[];
 for(let i=0;i<chosen.length;i+=3)await Promise.all(chosen.slice(i,i+3).map(async e=>{
  const checkedAt=new Date().toISOString(),id=e.sourceUrl.match(/(?:[?&](?:id|announce_id)=|\/)(\d+)(?:[?#]|$)/)?.[1]||e.id.split('-').at(-1)!;
  const n:FastNotice={gameId:e.gameId,region:e.region,locale:e.sourceLocale||'ko',id,title:e.sourceTitle,url:e.sourceUrl,publishedAt:e.publishedAt};
  try{
   let body=await regionalDetail(n,fetcher);
   if(!body){const r=await fetcher(n.url,{redirect:'manual',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);body=await r.text();if(body.length>2000000)throw Error('Official body exceeds review limit');}
   const d=await captureDocument(n,body,checkedAt);checks.push({source:'body/'+d.id,url:n.url,checkedAt,status:d.sourceAccess==='body'?'ok':'error',sourceAccess:d.sourceAccess,detailStatus:d.status,error:d.sourceAccess==='body'?undefined:'Original body remains unreadable'});
  }catch(error){const message=error instanceof Error?error.message:'Source unavailable';await captureDocument(n,undefined,checkedAt,message);checks.push({source:'body/'+e.id,url:n.url,checkedAt,status:'error',error:message});}
 }));
 const all=await reviewQueue(5000),pending=all.filter(d=>d.status!=='reviewed');
 const result={checkedAt:new Date().toISOString(),checks,pending:pending.length,unavailable:pending.filter(d=>d.status==='unavailable').length,coverage:collectionCoverage(data.entries)};
 await env.DB!.prepare("INSERT INTO operations_health(key,payload) VALUES('collection',?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload").bind(JSON.stringify(result)).run();
 return result;
}
