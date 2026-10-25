import {checkpointedRefresh,type RefreshProgress} from './refresh-progress';
import {env} from 'cloudflare:workers';
import {readData,readBaseData,saveEntries} from './store';
import {refreshFeeds} from './feeds';
import {koreanFastSources,noticeEntry,noticeText,noticeMetadataChange,completeNoticeMetadata} from './fast-notices';
import {queueBroadcastRecap,publishBroadcastRecapsStep} from './broadcast-recaps';
import {channelVideos,embeddedJson,readBroadcast} from './broadcast-metadata';
import {localized,type Entry,type Locale,type Region} from './types';
import {effectiveRegion} from './presentation';
import {games} from './games';
import {readOfficialChannels} from './official-social-store';
import {retryFetch} from './retry-fetch';
import {refreshHealth,recordHealth,readbackIssues} from './service-health';
import {captureDocument} from './collection-store';
import {collectRegionalNotices,collectPendingDocuments} from './official-collection';
import {refreshWuwaReferenceStep} from './wuwa-reference-store';
import {refreshCharacterRostersStep} from './character-roster-refresh';
import {refreshLeaksStep} from './leaks-store';
import {refreshOfficialUploadsStep} from './official-upload-store';
const interval=10*60*1000;
async function html(url:string){
 for(let hop=0;hop<4;hop++){
  const r=await retryFetch(url,{redirect:'manual'});
  if([301,302,303,307,308].includes(r.status)){
   const location=r.headers.get('location');if(!location)throw Error('Redirect without location');
   const next=new URL(location,url);
   // Anonymous YouTube requests can pass through first-party hosts such as
   // consent.youtube.com. Accept the youtube.com registrable domain while
   // continuing to reject lookalike hosts and credential-bearing URLs.
   if(next.protocol!=='https:'||!(next.hostname==='youtube.com'||next.hostname.endsWith('.youtube.com'))||next.username||next.password)throw Error('Unsupported channel redirect');
   url=next.href;continue;
  }
  if(!r.ok)throw Error('HTTP '+r.status);const s=await r.text();if(!s)throw Error('HTTP 200 empty response');if(s.length>5000000)throw Error('Response exceeds metadata limit');return s;
 }
 throw Error('Too many channel redirects');
}
async function pool<T,R>(items:T[],fn:(x:T)=>Promise<R>,n=3){const out:R[]=[];let i=0;await Promise.all(Array.from({length:Math.min(n,items.length)},async()=>{while(i<items.length){const index=i++;out[index]=await fn(items[index]);}}));return out;}
const normalize=(u:string)=>{try{const x=new URL(u);x.protocol='https:';x.hostname=x.hostname.replace(/^www\./,'');if(!(x.hostname==='re.bluepoch.com'&&x.pathname==='/home/detail.html'&&/^#newsId\?\d+$/.test(x.hash)))x.hash='';x.searchParams.sort();return x.href.replace(/\/$/,'');}catch{return u;}};
export async function runFastRefresh(){return checkpointedRefresh(performRefreshStage);}
export async function performRefreshStage(p:RefreshProgress):Promise<any>{
 const db=env.DB!;
 const startedAt=p.startedAt;
 if(p.stage==='korean'){
  const before=await readData({automatic:true,collection:true});if(!before.persistent)throw Error('Persistent storage unavailable');
  const known=new Set(before.entries.map(e=>normalize(e.sourceUrl)));
  for(const e of before.entries)for(const u of Object.values(e.localizationSources||{}))if(u)known.add(normalize(u));
  const noticed:Entry[]=[];const nativeChanges:Entry[]=[];const changedNotices:{notice:import("./fast-notices").FastNotice;checkedAt:string}[]=[];const changedNeedsReview:string[]=[];
  // Korean official sources are queried before the existing localized/regional feeds.
  const koreanChecks=await pool(koreanFastSources.slice(p.cursor||0,(p.cursor||0)+3),async source=>{
   const at=new Date().toISOString();
   try{
    const rows=await source.load(((url,init)=>retryFetch(typeof url==='string'?url:url instanceof URL?url.href:url.url,init)) as typeof fetch);if(!rows.length)throw Error('HTTP 200 without readable official notices');
    let added=0;
    for(const n of rows.slice(0,20)){
     const url=normalize(n.url);if(known.has(url)){
      const old=before.entries.find(e=>normalize(e.sourceUrl)===url&&e.sourceLocale===n.locale);
      const changed=noticeMetadataChange(old,n,at);if(changed){nativeChanges.push(changed);changedNotices.push({notice:n,checkedAt:at});changedNeedsReview.push(changed.id);}
      continue;
     }
     const entry=noticeEntry(n,at);known.add(url);noticed.push(entry);changedNotices.push({notice:n,checkedAt:at});added++;
    }
    return {source:source.key,url:source.url,checkedAt:at,status:source.coverage?'limited':'ok',count:rows.length,added,...(source.coverage?{coverage:source.coverage,error:'Only homepage headlines are readable; full official notice feed requires separate review'}:{})};
   }catch(e){return {source:source.key,url:source.url,checkedAt:at,status:'error',error:e instanceof Error?e.message:'Source unavailable'};}
  });
  // First persist minimal notices. No pickup dates, prices, images or summaries are inferred.
  const fullNative=nativeChanges.length?await readBaseData({ids:nativeChanges.map(e=>e.id)}):{entries:[],persistent:true};
  if(!fullNative.persistent)throw Error('Original notice records unavailable');
  const nativeMap=new Map(fullNative.entries.map(e=>[e.id,e]));
  await saveEntries([...noticed,...nativeChanges.map(e=>{const full=nativeMap.get(e.id);if(!full)throw Error('Original notice record missing');return completeNoticeMetadata(full,e);})]);
  const noticeReadback=await readData({automatic:true,collection:true});
  if(noticed.some(e=>!noticeReadback.entries.some(v=>v.id===e.id)))throw Error('Notice readback failed');
  for(const {notice,checkedAt} of changedNotices)await captureDocument(notice,undefined,checkedAt);
  const cursor=(p.cursor||0)+3;
  return {...p,stage:cursor>=koreanFastSources.length?'uploads':'korean',cursor:cursor>=koreanFastSources.length?0:cursor,koreanChecks:[...(p.koreanChecks||[]),...koreanChecks],noticedCount:(p.noticedCount||0)+noticed.length,changedNeedsReview:[...(p.changedNeedsReview||[]),...changedNeedsReview]};
 }
 if(p.stage==='uploads'){const result=await refreshOfficialUploadsStep(p.cursor||0);return {...p,stage:result.done?'feeds':'uploads',cursor:result.done?0:result.nextCursor,uploadChecks:[...(p.uploadChecks||[]),...result.checks]};}
 if(p.stage==='feeds')return {...p,stage:'regional',feeds:await refreshFeeds()};
 if(p.stage==='regional'){const batch=await collectRegionalNotices(p.cursor||0,3),done=batch.nextOffset>=batch.total;return {...p,stage:done?'channels':'regional',cursor:done?0:batch.nextOffset,regional:{checks:[...(p.regional?.checks||[]),...batch.checks],added:(p.regional?.added||0)+batch.added,metadataChanged:[...(p.regional?.metadataChanged||[]),...batch.metadataChanged]}};}
 if(p.stage==='channels'){
  const current=await readData({automatic:true,collection:true});
  const channels=new Map<string,{gameId:string;locale:Locale;region:Region}>();
  for(const e of current.entries)for(const v of e.videos||[])if(v.official)for(const u of v.evidenceUrls||[])if(/^https:\/\/www\.youtube\.com\/(?:@[^/?]+|channel\/[\w-]+)$/.test(u))channels.set(u,{gameId:e.gameId,locale:v.locale,region:effectiveRegion(games.find(g=>g.id===e.gameId)!,e.region)});
  // The reviewed channel registry also covers games with no character videos yet.
  for(const c of await readOfficialChannels())if(c.platform==='youtube'&&c.official){
   const game=games.find(g=>g.id===c.gameId);if(!game)continue;
   const url=c.url.replace(/\/(?:videos|streams)\/?$/,'').replace(/\/$/,'');
   // Prefer the registry for a service/language over incidental video evidence.
   for(const [key,meta] of channels)if(meta.gameId===c.gameId&&meta.locale===c.locale&&meta.region===effectiveRegion(game,c.region))channels.delete(key);
   channels.set(url,{gameId:c.gameId,locale:c.locale,region:effectiveRegion(game,c.region)});
  }
  if(p.channelRows){channels.clear();for(const [url,meta] of p.channelRows)channels.set(url,meta);}else p.channelRows=[...channels];
  const watches=new Map<string,{gameId:string;locale:Locale;region:Region;channelId:string;old?:Entry}>(p.watchRows||[]);
  const queueStored=(meta:{gameId:string;locale:Locale;region:Region},channelId:string)=>{
   for(const e of current.entries)if(e.broadcast?.youtubeId&&['scheduled','live'].includes(e.broadcast.status)&&e.gameId===meta.gameId&&e.broadcast.locale===meta.locale&&effectiveRegion(games.find(g=>g.id===e.gameId)!,e.region)===meta.region)watches.set(e.broadcast.youtubeId,{...meta,channelId,old:e});
  };
  // A failed listing must not prevent checks of already known watch URLs.
  for(const [url,meta] of channels){const id=/\/channel\/(UC[\w-]+)$/.exec(url)?.[1];if(id)queueStored(meta,id);}
  const channelChecks=await pool([...channels].slice(p.cursor||0,(p.cursor||0)+6),async([url,meta])=>{
   const checkedAt=new Date().toISOString();try{
    const data=channelVideos(await html(url+'/streams'));if(!data.channelId)throw Error('HTTP 200 without official channel metadata');
    const expected=/\/channel\/(UC[\w-]+)$/.exec(url)?.[1];if(expected&&data.channelId!==expected)throw Error('Official channel identity mismatch');
    for(const id of data.ids){const old=current.entries.find(e=>e.broadcast?.youtubeId===id&&e.gameId===meta.gameId&&e.broadcast.locale===meta.locale);watches.set(id,{...meta,channelId:data.channelId,old});}
    queueStored(meta,data.channelId);
    return {url:url+'/streams',checkedAt,status:'ok'};
   }catch(e){return {url:url+'/streams',checkedAt,status:'error',error:e instanceof Error?e.message:'Source unavailable'};}
  },2);
  const cursor=(p.cursor||0)+6;
  return {...p,stage:cursor>=channels.size?'broadcasts':'channels',cursor:cursor>=channels.size?0:cursor,channelChecks:[...(p.channelChecks||[]),...channelChecks],watchRows:[...watches].map(([id,m])=>[id,{...m,...(m.old?{old:{id:m.old.id,broadcast:m.old.broadcast}}:{})}])};
 }
 if(p.stage==='broadcasts'){
 const changedNeedsReview:string[]=[];
  const watches=new Map<string,{gameId:string;locale:Locale;region:Region;channelId:string;old?:Entry}>(p.watchRows||[]);
  const broadcastChecks=await pool([...watches].slice(p.cursor||0,(p.cursor||0)+6),async([id,meta])=>{
   const checkedAt=new Date().toISOString(),url='https://www.youtube.com/watch?v='+id;
   try{
    const page=await html(url),p=embeddedJson(page,'ytInitialPlayerResponse');
    const b=readBroadcast(page,id,meta.channelId,meta.locale,checkedAt,meta.old?.broadcast);
    if(!b){const reason=p?.playabilityStatus?.status;return {url,checkedAt,status:reason&&reason!=='OK'?'error':'unconfirmed',error:reason||'No verified livestream metadata'};}
    if(meta.old){
     // Patch only the broadcast object, using compare-and-swap to avoid overwriting an hourly review.
     const old=meta.old.broadcast!;
     if(old.originalTitle!==b.originalTitle)changedNeedsReview.push(meta.old.id);
     const updated=await db.prepare("UPDATE entries SET payload=json_set(payload,'$.broadcast',json(?)),updated_at=? WHERE id=? AND json_extract(payload,'$.broadcast')=json(?)").bind(JSON.stringify(b),checkedAt,meta.old.id,JSON.stringify(old)).run();
     let recap:unknown;try{if(updated.meta.changes&&b.status==='ended')recap=await queueBroadcastRecap(meta,b,page);}catch(e){recap={queued:false,error:e instanceof Error?e.message:'Recap queue failed'};}
     return {url,checkedAt,status:updated.meta.changes?'ok':'review',broadcastStatus:b.status,persisted:!!updated.meta.changes,...(recap?{recap}:{})};
    }
    if(b.status==='ended')return {url,checkedAt,status:'ok',broadcastStatus:'ended',recap:await queueBroadcastRecap(meta,b,page)};
    const title=localized('','','','');title[meta.locale]=b.originalTitle;
    const entry:Entry={id:`broadcast-${meta.gameId}-${meta.locale}-${id}`,gameId:meta.gameId,region:meta.region,server:meta.region,kind:'update',title,summary:localized('','','',''),sourceUrl:url,sourceTitle:b.originalTitle,sourceLocale:meta.locale,sourceKind:'video',officialLocales:[meta.locale],translatedLocales:[],startAt:null,endAt:null,publishedAt:b.announcedAt,verifiedAt:checkedAt,broadcast:b};
    await saveEntries([entry]);return {url,checkedAt,status:'ok',broadcastStatus:b.status,added:entry.id};
   }catch(e){return {url,checkedAt,status:'error',error:e instanceof Error?e.message:'Source unavailable'};}
  },2);
  const cursor=(p.cursor||0)+6;
  return {...p,stage:cursor>=watches.size?'recaps':'broadcasts',cursor:cursor>=watches.size?0:cursor,broadcastChecks:[...(p.broadcastChecks||[]),...broadcastChecks],changedNeedsReview:[...(p.changedNeedsReview||[]),...changedNeedsReview]};
 }
 if(p.stage==='recaps')return {...p,stage:'collection',recapCheck:await publishBroadcastRecapsStep()};
 if(p.stage==='collection')return {...p,stage:'reference',collection:await collectPendingDocuments()};
 if(p.stage==='reference'){const check=await refreshWuwaReferenceStep();return {...p,stage:check.done?'leaks':'reference',referenceCheck:check};}
 if(p.stage==='rosters')return {...p,stage:'finalize',rosterCheck:await refreshCharacterRostersStep()};
 if(p.stage==='leaks'){const check=await refreshLeaksStep();return {...p,stage:check.done?'rosters':'leaks',leakCheck:check};}
 if(p.stage!=='finalize')throw Error('Unknown refresh stage');
  const {koreanChecks=[],feeds=[],regional={checks:[],added:0},channelChecks=[],broadcastChecks=[],collection,noticedCount=0,changedNeedsReview=[]}=p;
  const [automatic,effective]=await Promise.all([readData({automatic:true,collection:true}),readData({collection:true})]);
  if(!automatic.persistent||!effective.persistent)throw Error('Final readback failed');
  const validationIssues=readbackIssues(automatic.entries,effective.entries);
  const weaponCheck={source:'wuwa/global/weapons',status:collection.weapons.issues.length?'error':'ok',checkedAt:collection.weapons.checkedAt,count:collection.weapons.changedEntries.length,error:collection.weapons.issues.join('; ')||undefined};
  const health=refreshHealth([...koreanChecks,...feeds,...regional.checks,...channelChecks,...(p.uploadChecks||[]),...broadcastChecks,...collection.checks,weaponCheck,...(p.referenceCheck?[p.referenceCheck]:[]),...(p.leakCheck?[p.leakCheck]:[]),...(p.rosterCheck?[p.rosterCheck]:[]),...(p.recapCheck?[p.recapCheck]:[])],!validationIssues.length);
  const result={ok:health.outcome!=='failed'&&health.outcome!=='validation-failed',partial:health.outcome==='partial',...health,validationIssues,startedAt,finishedAt:new Date().toISOString(),noticesAdded:noticedCount+regional.added,changedNeedsReview:[...new Set(changedNeedsReview)],koreanChecks,feeds,regionalChecks:regional.checks,channelChecks,uploadChecks:p.uploadChecks||[],broadcastChecks,structuredChecks:[weaponCheck,...(p.referenceCheck?[p.referenceCheck]:[]),...(p.leakCheck?[p.leakCheck]:[]),...(p.rosterCheck?[p.rosterCheck]:[]),...(p.recapCheck?[p.recapCheck]:[])],collection,readback:{automatic:automatic.entries.length,effective:effective.entries.length},detailReview:'native-body-publication-with-separate-review-queue',intervalMinutes:10};
  return result;
}
