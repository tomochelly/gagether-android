import {importNteProfiles} from './nte-profile-store';
import {importAdditionalGameContent} from './additional-content-store';
import {importMaintainedArtwork} from './maintained-artwork-store';
import {env} from 'cloudflare:workers';
import {regionalOfficialSources,regionalDetail,regionalMetadataChanges,type RegionalNotice} from './regional-notices';
import {noticeEntry,completeNoticeMetadata,type FastNotice} from './fast-notices';
import {safeSource} from './types';
import {retryFetch} from './retry-fetch';
import {readData,readBaseData,saveEntries} from './store';
import {captureDocument,reviewQueue} from './collection-store';
import {importCapturedBodies} from './source-body-store';
import {importWuwaWeapons} from './wuwa-weapon-store';
import {collectionCoverage,pickupNotice} from './collection-review';
import {bodyCollectionCandidate,selectBodyCandidates} from './body-collection-candidate';
const fetcher=((url:RequestInfo|URL,init?:RequestInit)=>retryFetch(typeof url==='string'?url:url instanceof URL?url.href:url.url,init)) as typeof fetch;
export function noticeSourceId(url:string){const u=new URL(url);return u.searchParams.get('id')||u.searchParams.get('announce_id')||u.searchParams.get('content_id')||u.searchParams.get('news_detail_id')||u.searchParams.get('thread')||u.hash.match(/newsId\?(\d+)/)?.[1]||u.pathname.split('/').filter(Boolean).at(-1)||'';}
export async function fetchReviewDocument(n:FastNotice){
 if(!safeSource(n.url,n.gameId))throw Error('Unrecognized official source');
 const checkedAt=new Date().toISOString();
 try{
  let body=await regionalDetail(n,fetcher);
  if(!body){const r=await fetcher(n.url,{redirect:'manual',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);body=await r.text();}
  if(body.length>2000000)throw Error('Official body exceeds review limit');
  return await captureDocument(n,body,checkedAt);
 }catch(error){return await captureDocument(n,undefined,checkedAt,error instanceof Error?error.message:'Source unavailable');}
}
export async function collectRegionalNotices(){
 const before=await readData({automatic:true,collection:true}),known=new Set(before.entries.map(e=>e.sourceUrl));
 const notices:RegionalNotice[]=[],inspected:{notice:RegionalNotice;checkedAt:string}[]=[],checks:any[]=[];
 for(let offset=0;offset<regionalOfficialSources.length;offset+=3)await Promise.all(regionalOfficialSources.slice(offset,offset+3).map(async source=>{
  const checkedAt=new Date().toISOString();try{
   const rows=await source.load(fetcher);if(!rows.length)throw Error('HTTP 200 without readable official notices');
   const fresh=rows.filter(n=>!known.has(n.url));for(const n of fresh){known.add(n.url);notices.push(n);}
   // Index success is explicitly separate from body review and pickup application.
   const latestPublishedAt=rows.map(n=>n.publishedAt).filter(Boolean).sort().at(-1),stale=!!(source.staleAfterDays&&latestPublishedAt&&Date.now()-Date.parse(latestPublishedAt)>source.staleAfterDays*86400000);
   checks.push({source:source.key,gameId:source.gameId,region:source.region,locale:source.locale,url:source.url,checkedAt,status:stale?'limited':'ok',count:rows.length,added:fresh.length,latestPublishedAt,...(stale?{error:'Official language feed is stale; current native Steam notices are checked independently'}:{})});
   for(const n of rows.slice(0,12))inspected.push({notice:n,checkedAt});
  }catch(e){checks.push({source:source.key,gameId:source.gameId,region:source.region,locale:source.locale,url:source.url,checkedAt,status:'error',error:e instanceof Error?e.message:'Source unavailable'});}
 }));
 if(notices.length){await saveEntries(notices.map(n=>noticeEntry(n,new Date().toISOString())));const readback=await readData({automatic:true,collection:true});if(notices.some(n=>!readback.entries.some(e=>e.sourceUrl===n.url)))throw Error('Regional notice readback failed');}
 const metadataCandidates=regionalMetadataChanges(before.entries,inspected.map(r=>r.notice),new Date().toISOString());
 const stored=metadataCandidates.length?await readBaseData({ids:metadataCandidates.map(e=>e.id)}):{entries:[],persistent:true};if(!stored.persistent)throw Error('Full original regional records unavailable');const originals=stored.entries;
 const metadataChanged=metadataCandidates.map(e=>{const full=originals.find(o=>o.id===e.id);if(!full)throw Error('Original regional notice unavailable');return completeNoticeMetadata(full,e);});
 if(metadataChanged.length){await saveEntries(metadataChanged);const check=await readData({automatic:true,collection:true});if(metadataChanged.some(e=>!check.entries.some(x=>x.id===e.id&&x.sourceTitle===e.sourceTitle&&x.publishedAt===e.publishedAt)))throw Error('Regional metadata readback failed');}
 for(const {notice,checkedAt} of inspected)await captureDocument(notice,notice.bodyHtml,checkedAt);
 return {checks,added:notices.length,metadataChanged:metadataChanged.map(e=>e.id)};
}
export async function collectPendingDocuments(){
 const data=await readData({automatic:true,collection:true}),queue=await reviewQueue(5000),previous=new Map(queue.map(d=>[d.url,d]));
 const candidates=data.entries.filter(bodyCollectionCandidate).sort((a,b)=>Number(pickupNotice(b.sourceTitle))-Number(pickupNotice(a.sourceTitle))||(b.publishedAt||'').localeCompare(a.publishedAt||''));
 const variants=candidates.flatMap(e=>[e,...Object.entries(e.localizationSources||{}).filter(([,u])=>u&&u!==e.sourceUrl).map(([l,u])=>({...e,sourceUrl:u!,sourceLocale:l as import('./types').Locale,sourceTitle:e.title[l as import('./types').Locale]||e.sourceTitle}))]);
 const unique=[...new Map(variants.map(e=>[e.sourceUrl,e])).values()];
 const chosen=selectBodyCandidates(unique,previous,Date.now(),10);
 const checks:any[]=[];
 for(let i=0;i<chosen.length;i+=3)await Promise.all(chosen.slice(i,i+3).map(async e=>{
  const checkedAt=new Date().toISOString(),id=e.sourceUrl.match(/(?:[?&](?:id|announce_id)=|\/)(\d+)(?:[?#]|$)/)?.[1]||e.id.split('-').at(-1)!;
  const sourceId=noticeSourceId(e.sourceUrl);
  const n:FastNotice={gameId:e.gameId,region:e.region,locale:e.sourceLocale||'ko',id:sourceId,title:e.sourceTitle,url:e.sourceUrl,publishedAt:e.publishedAt};
  const d=await fetchReviewDocument(n);checks.push({source:'body/'+d.id,url:n.url,checkedAt:d.checkedAt,status:d.sourceAccess==='body'?'ok':'error',sourceAccess:d.sourceAccess,detailStatus:d.status,error:d.error||(d.sourceAccess==='body'?undefined:'Original body remains unreadable')});
 }));
 const bodyImport=await importCapturedBodies(undefined,100);
 const additionalContent=await importAdditionalGameContent();
 checks.push(...additionalContent.checks);
 const weapons=await importWuwaWeapons();
 const artwork=await importMaintainedArtwork();
 const profiles=await importNteProfiles();
 checks.push(...profiles.discovery.checks.map((s:any)=>({...s,source:'profile-index/'+s.url,checkedAt:profiles.discovery.checkedAt})));
 checks.push(...profiles.sources.map(s=>({source:'profile/'+s.url,url:s.url,checkedAt:s.checkedAt,status:s.status,error:s.error,failureKind:s.failureKind})));
 const all=await reviewQueue(5000),pending=all.filter(d=>d.status!=='reviewed');
 const result={checkedAt:new Date().toISOString(),bodyImport,additionalContent,weapons,artwork,profiles,checks,pending:pending.length,unavailable:pending.filter(d=>d.status==='unavailable').length,coverage:collectionCoverage(data.entries)};
 await env.DB!.prepare("INSERT INTO operations_health(key,payload) VALUES('collection',?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload").bind(JSON.stringify(result)).run();
 return result;
}
