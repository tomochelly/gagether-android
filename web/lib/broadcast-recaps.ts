import {env} from 'cloudflare:workers';
import {embeddedJson} from './broadcast-metadata';
import {readBaseData,saveEntries,saveEntryChanges} from './store';
import {localized,type Entry,type OfficialBroadcast,type Locale,type Region} from './types';
const prefix='broadcast-recap:';
const digest=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
export function endedBroadcastDocument(html:string,b:OfficialBroadcast){
 const player=embeddedJson(html,'ytInitialPlayerResponse'),v=player?.videoDetails,m=player?.microformat?.playerMicroformatRenderer;
 if(b.status!=='ended'||!b.endedAt||v?.videoId!==b.youtubeId||!v?.isLiveContent||!m?.liveBroadcastDetails?.endTimestamp)return null;
 const text=typeof v.shortDescription==='string'?v.shortDescription.trim().slice(0,50000):'';
 const publishedAt=typeof m.publishDate==='string'&&/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(m.publishDate)&&Number.isFinite(Date.parse(m.publishDate))?m.publishDate:null;
 return {text,title:b.originalTitle,publishedAt,actualEndAt:b.endedAt,watched:false as const,captionAvailable:!!player?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length};
}
export async function queueBroadcastRecap(meta:{gameId:string;region:Region;locale:Locale},b:OfficialBroadcast,html:string){
 const document=endedBroadcastDocument(html,b);if(!document)return {queued:false};
 if(Date.now()-Date.parse(document.actualEndAt)>14*86400000)return {queued:false,historical:true};
 const id=`recap-${meta.gameId}-${meta.locale}-${b.youtubeId}`,key=prefix+id,hash=await digest(JSON.stringify({title:document.title,text:document.text,publishedAt:document.publishedAt}));
 const prior=await env.DB!.prepare('SELECT payload FROM operations_health WHERE key=?').bind(key).first<{payload:string}>();const old=prior?JSON.parse(prior.payload):null;
 if(old?.bodyHash===hash&&['published','empty-description'].includes(old?.status))return {queued:false,unchanged:true};
 const next={id,...meta,youtubeId:b.youtubeId,sourceUrl:b.sourceUrl,channel:b.channel,...document,bodyHash:hash,status:'queued',queuedAt:old?.queuedAt||new Date().toISOString(),checkedAt:new Date().toISOString(),videoAnalysis:'not-connected'};
 await env.DB!.prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload').bind(key,JSON.stringify(next)).run();return {queued:true,id};
}
export async function readBroadcastRecaps(){const rows=await env.DB!.prepare("SELECT payload FROM operations_health WHERE key LIKE 'broadcast-recap:%' ORDER BY json_extract(payload,'$.checkedAt') DESC LIMIT 100").all<{payload:string}>();return rows.results.map(r=>JSON.parse(r.payload));}
export async function publishBroadcastRecapsStep(gameId?:string){
 const rows=(await readBroadcastRecaps()).filter(r=>r.status==='queued'&&(!gameId||r.gameId===gameId)).slice(0,2),checks=[];
 for(const row of rows){try{
  if(!row.text){await env.DB!.prepare("UPDATE operations_health SET payload=? WHERE key=? AND json_extract(payload,'$.bodyHash')=?").bind(JSON.stringify({...row,status:'empty-description',videoAnalysis:'not-connected'}),prefix+row.id,row.bodyHash).run();checks.push({id:row.id,status:'limited',error:'Publisher description empty; actual video analysis is not connected'});continue;}
  const base=await readBaseData({ids:[row.id]});if(!base.persistent)throw Error('Original recap storage unavailable');const old=base.entries.find(e=>e.id===row.id),existing=old?.sourceBodies?.[row.locale as Locale];
  if(existing?.bodyHash!==row.bodyHash){
   const title={...(old?.title||localized('','','',''))};title[row.locale as Locale]=row.title;
   const entry:Entry={...old,id:row.id,gameId:row.gameId,region:row.region,server:row.region,kind:'update',title,summary:old?.summary||localized('','','',''),sourceUrl:row.sourceUrl,sourceTitle:row.title,sourceLocale:row.locale,sourceKind:'video',officialLocales:[row.locale],translatedLocales:[],startAt:null,endAt:null,publishedAt:row.publishedAt,verifiedAt:row.checkedAt,sourceBodies:{...old?.sourceBodies,[row.locale]:{title:row.title,locale:row.locale,sourceUrl:row.sourceUrl,text:row.text,images:[],bodyHash:row.bodyHash,importedAt:row.checkedAt,sourceKind:'official'}}};
   await saveEntryChanges([{before:old,after:entry}]);
  }
  const check=await readBaseData({ids:[row.id]});if(check.entries[0]?.sourceBodies?.[row.locale as Locale]?.bodyHash!==row.bodyHash)throw Error('Recap readback failed');
  // CAS prevents an updated description being marked complete by an older worker.
  const saved=await env.DB!.prepare("UPDATE operations_health SET payload=? WHERE key=? AND json_extract(payload,'$.bodyHash')=?").bind(JSON.stringify({...row,status:'published',publishedEntryId:row.id,importedAt:new Date().toISOString(),evidence:'official-description',videoAnalysis:'not-connected',watched:false}),prefix+row.id,row.bodyHash).run();
  checks.push({id:row.id,status:saved.meta.changes?'ok':'limited',descriptionPublished:!!saved.meta.changes,videoAnalyzed:false});
 }catch(e){checks.push({id:row.id,status:'error',error:e instanceof Error?e.message:'Recap publication failed'});}}
 return {source:'broadcasts/recaps',status:checks.some(c=>c.status==='error')?'error':checks.some(c=>c.status==='limited')?'limited':'ok',checkedAt:new Date().toISOString(),checks,videoAnalysis:'not-connected'};
}
