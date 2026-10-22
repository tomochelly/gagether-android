import {env} from 'cloudflare:workers';
import {readData,saveEntries} from './store';
import {refreshFeeds} from './feeds';
import {koreanFastSources,noticeEntry,noticeText} from './fast-notices';
import {channelVideos,embeddedJson,readBroadcast} from './broadcast-metadata';
import {localized,type Entry,type Locale,type Region} from './types';
import {effectiveRegion} from './presentation';
import {games} from './games';
import {readOfficialChannels} from './official-social-store';
import {retryFetch} from './retry-fetch';
import {refreshHealth,recordHealth} from './service-health';
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
const normalize=(u:string)=>{try{const x=new URL(u);x.protocol='https:';x.hostname=x.hostname.replace(/^www\./,'');x.hash='';x.searchParams.sort();return x.href.replace(/\/$/,'');}catch{return u;}};
export async function runFastRefresh(){
 const db=env.DB;if(!db)throw Error('Persistent storage unavailable');
 const now=Date.now(),startedAt=new Date(now).toISOString();
 const lock=await db.prepare("INSERT INTO refresh_jobs (id,lease_until,last_started_at) VALUES ('official-fast',?,?) ON CONFLICT(id) DO UPDATE SET lease_until=excluded.lease_until,last_started_at=excluded.last_started_at WHERE refresh_jobs.lease_until<=? AND (refresh_jobs.last_started_at IS NULL OR refresh_jobs.last_started_at<=?)").bind(now+20*60000,startedAt,now,new Date(now-interval+30000).toISOString()).run();
 if(!lock.meta.changes)return {ok:true,skipped:true,reason:'Already running or checked within ten minutes'};
 try{
  const before=await readData({automatic:true});if(!before.persistent)throw Error('Persistent storage unavailable');
  const known=new Set(before.entries.map(e=>normalize(e.sourceUrl)));
  for(const e of before.entries)for(const u of Object.values(e.localizationSources||{}))if(u)known.add(normalize(u));
  const noticed:Entry[]=[];const changedNeedsReview:string[]=[];
  // Korean official sources are queried before the existing localized/regional feeds.
  const koreanChecks=await pool(koreanFastSources,async source=>{
   const at=new Date().toISOString();
   try{
    const rows=await source.load(((url,init)=>retryFetch(typeof url==='string'?url:url instanceof URL?url.href:url.url,init)) as typeof fetch);if(!rows.length)throw Error('HTTP 200 without readable official notices');
    let added=0;
    for(const n of rows.slice(0,20)){
     const url=normalize(n.url);if(known.has(url)){
      const old=before.entries.find(e=>normalize(e.sourceUrl)===url&&e.sourceLocale===n.locale);
      if(old&&noticeText(old.sourceTitle)!==noticeText(n.title).slice(0,240))changedNeedsReview.push(old.id);
      continue;
     }
     const entry=noticeEntry(n,at);known.add(url);noticed.push(entry);added++;
    }
    return {source:source.key,url:source.url,checkedAt:at,status:'ok',count:rows.length,added};
   }catch(e){return {source:source.key,url:source.url,checkedAt:at,status:'error',error:e instanceof Error?e.message:'Source unavailable'};}
  });
  // First persist minimal notices. No pickup dates, prices, images or summaries are inferred.
  await saveEntries(noticed);
  const noticeReadback=await readData({automatic:true});
  if(noticed.some(e=>!noticeReadback.entries.some(v=>v.id===e.id)))throw Error('Notice readback failed');
  const feeds=await refreshFeeds();
  const current=await readData({automatic:true});
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
  const watches=new Map<string,{gameId:string;locale:Locale;region:Region;channelId:string;old?:Entry}>();
  const queueStored=(meta:{gameId:string;locale:Locale;region:Region},channelId:string)=>{
   for(const e of current.entries)if(e.broadcast?.youtubeId&&['scheduled','live'].includes(e.broadcast.status)&&e.gameId===meta.gameId&&e.broadcast.locale===meta.locale&&effectiveRegion(games.find(g=>g.id===e.gameId)!,e.region)===meta.region)watches.set(e.broadcast.youtubeId,{...meta,channelId,old:e});
  };
  // A failed listing must not prevent checks of already known watch URLs.
  for(const [url,meta] of channels){const id=/\/channel\/(UC[\w-]+)$/.exec(url)?.[1];if(id)queueStored(meta,id);}
  const channelChecks=await pool([...channels],async([url,meta])=>{
   const checkedAt=new Date().toISOString();try{
    const data=channelVideos(await html(url+'/streams'));if(!data.channelId)throw Error('HTTP 200 without official channel metadata');
    const expected=/\/channel\/(UC[\w-]+)$/.exec(url)?.[1];if(expected&&data.channelId!==expected)throw Error('Official channel identity mismatch');
    for(const id of data.ids){const old=current.entries.find(e=>e.broadcast?.youtubeId===id&&e.gameId===meta.gameId&&e.broadcast.locale===meta.locale);watches.set(id,{...meta,channelId:data.channelId,old});}
    queueStored(meta,data.channelId);
    return {url:url+'/streams',checkedAt,status:'ok'};
   }catch(e){return {url:url+'/streams',checkedAt,status:'error',error:e instanceof Error?e.message:'Source unavailable'};}
  },2);
  const broadcastChecks=await pool([...watches],async([id,meta])=>{
   const checkedAt=new Date().toISOString(),url='https://www.youtube.com/watch?v='+id;
   try{
    const page=await html(url),p=embeddedJson(page,'ytInitialPlayerResponse');
    const b=readBroadcast(page,id,meta.channelId,meta.locale,checkedAt,meta.old?.broadcast);
    if(!b){const reason=p?.playabilityStatus?.status;return {url,checkedAt,status:reason&&reason!=='OK'?'error':'unconfirmed',error:reason||'No verified livestream metadata'};}
    if(meta.old){
     // Patch only the broadcast object, using compare-and-swap to avoid overwriting an hourly review.
     const old=meta.old.broadcast!;
     if(old.originalTitle!==b.originalTitle){changedNeedsReview.push(meta.old.id);return {url,checkedAt,status:'review',error:'Original title changed; localization review required'};}
     const updated=await db.prepare("UPDATE entries SET payload=json_set(payload,'$.broadcast',json(?)),updated_at=? WHERE id=? AND json_extract(payload,'$.broadcast')=json(?)").bind(JSON.stringify(b),checkedAt,meta.old.id,JSON.stringify(old)).run();
     return {url,checkedAt,status:updated.meta.changes?'ok':'review',broadcastStatus:b.status,persisted:!!updated.meta.changes};
    }
    if(b.status==='ended')return {url,checkedAt,status:'ok',broadcastStatus:'ended',historical:true};
    const title=localized('공식 방송 · 현지화 확인 중','Official broadcast · localization pending','公式番組・翻訳確認中','官方直播·本地化待核实');title[meta.locale]=b.originalTitle;
    const entry:Entry={id:`broadcast-${meta.gameId}-${meta.locale}-${id}`,gameId:meta.gameId,region:meta.region,server:meta.region,kind:'update',title,summary:localized('공식 방송 메타데이터를 확인했습니다. 발표 내용은 별도 검수 후 반영합니다.','Official broadcast metadata checked. Announcements await separate review.','公式番組のメタデータを確認しました。発表内容は別途確認後に反映します。','已核实官方直播元数据，发布内容将另行核实。'),sourceUrl:url,sourceTitle:b.originalTitle,sourceLocale:meta.locale,sourceKind:'video',officialLocales:[meta.locale],translatedLocales:[],startAt:null,endAt:null,publishedAt:b.announcedAt,verifiedAt:checkedAt,broadcast:b};
    await saveEntries([entry]);return {url,checkedAt,status:'ok',broadcastStatus:b.status,added:entry.id};
   }catch(e){return {url,checkedAt,status:'error',error:e instanceof Error?e.message:'Source unavailable'};}
  },2);
  const [automatic,effective]=await Promise.all([readData({automatic:true}),readData()]);
  if(!automatic.persistent||!effective.persistent)throw Error('Final readback failed');
  const health=refreshHealth([...koreanChecks,...feeds,...channelChecks,...broadcastChecks],automatic.persistent&&effective.persistent);
  const result={ok:health.outcome!=='failed'&&health.outcome!=='validation-failed',partial:health.outcome==='partial',...health,startedAt,finishedAt:new Date().toISOString(),noticesAdded:noticed.length,changedNeedsReview:[...new Set(changedNeedsReview)],koreanChecks,feeds,channelChecks,broadcastChecks,readback:{automatic:automatic.entries.length,effective:effective.entries.length},detailReview:'hourly',intervalMinutes:10};
  await recordHealth(result);await db.prepare("UPDATE refresh_jobs SET lease_until=0,last_finished_at=?,result=? WHERE id='official-fast' AND last_started_at=?").bind(result.finishedAt,JSON.stringify(result),startedAt).run();return result;
 }catch(e){const failed={ok:false,outcome:'failed',finishedAt:new Date().toISOString(),error:e instanceof Error?e.message:'Refresh failed'};await recordHealth(failed).catch(()=>{});await db.prepare("UPDATE refresh_jobs SET lease_until=0,last_finished_at=?,result=? WHERE id='official-fast' AND last_started_at=?").bind(failed.finishedAt,JSON.stringify(failed),startedAt).run();throw e;}
}
