import {env} from 'cloudflare:workers';
import {embeddedJson} from './broadcast-metadata';
import {broadcastAnalysisStatus,publishReviewedBroadcastAnalyses,readBroadcastRecap} from './broadcast-analysis';
import reviewedAnalyses from '../content/reviewed-broadcast-analysis.json' with {type:'json'};
import {readBaseData,saveEntryChanges} from './store';
import {localized,type Entry,type OfficialBroadcast,type Locale,type Region} from './types';
const prefix='broadcast-recap:';
const digest=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
export function endedBroadcastDocument(html:string,b:OfficialBroadcast){
 const player=embeddedJson(html,'ytInitialPlayerResponse'),v=player?.videoDetails,m=player?.microformat?.playerMicroformatRenderer;
 if(!b.official||!b.metadataVerified||b.status!=='ended'||!b.endedAt||v?.videoId!==b.youtubeId||!v?.isLiveContent||!m?.liveBroadcastDetails?.endTimestamp)return null;
 const text=typeof v.shortDescription==='string'?v.shortDescription.trim().slice(0,50000):'';
 const publishedAt=typeof m.publishDate==='string'&&/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(m.publishDate)&&Number.isFinite(Date.parse(m.publishDate))?m.publishDate:null;
 const seconds=Number(v.lengthSeconds);
 return {text,title:b.originalTitle,publishedAt,actualEndAt:b.endedAt,...Number.isInteger(seconds)&&seconds>0&&seconds<=43200?{durationSeconds:seconds}:{},watched:false as const,captionAvailable:!!player?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length};
}
export async function queueBroadcastRecap(meta:{gameId:string;region:Region;locale:Locale},b:OfficialBroadcast,html:string){
 const document=endedBroadcastDocument(html,b);if(!document)return {queued:false};
 if(Date.now()-Date.parse(document.actualEndAt)>14*86400000)return {queued:false,historical:true};
 const id=`recap-${meta.gameId}-${meta.locale}-${b.youtubeId}`,key=prefix+id,hash=await digest(JSON.stringify({title:document.title,text:document.text,publishedAt:document.publishedAt}));
 const prior=await env.DB!.prepare('SELECT payload FROM operations_health WHERE key=?').bind(key).first<{payload:string}>();const old=prior?JSON.parse(prior.payload):null;
 if(old?.analysis?.status==='publishing'&&Number(old.analysis.leaseUntil)>Date.now())return {queued:false,analysisBusy:true};
 if(old?.bodyHash===hash&&old.official===true&&old.metadataVerified===true&&['published','empty-description'].includes(old?.status))return {queued:false,unchanged:true};
 const unchanged=old?.bodyHash===hash,retainedAnalysis=!unchanged&&old?.analysis?{analysis:{status:'stale-source',previousReviewHash:old.analysis.reviewHash,publishedSections:old.analysis.publishedSections||[],publishedFrameHashes:old.analysis.publishedFrameHashes||[]}}:{},next={...unchanged?old:retainedAnalysis,id,...meta,youtubeId:b.youtubeId,sourceUrl:b.sourceUrl,channel:b.channel,channelId:b.channelId,official:true,metadataVerified:true,...document,bodyHash:hash,status:unchanged?old.status:'queued',queuedAt:old?.queuedAt||new Date().toISOString(),checkedAt:new Date().toISOString(),videoAnalysis:unchanged&&old.videoAnalysis&&old.videoAnalysis!=='not-connected'?old.videoAnalysis:'awaiting-review'};
 const saved=prior?await env.DB!.prepare('UPDATE operations_health SET payload=? WHERE key=? AND payload=?').bind(JSON.stringify(next),key,prior.payload).run():await env.DB!.prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(key,JSON.stringify(next)).run();return {queued:!!saved.meta.changes,id};
}
export async function readBroadcastRecaps(){const rows=await env.DB!.prepare("SELECT payload FROM operations_health WHERE key LIKE 'broadcast-recap:%' ORDER BY json_extract(payload,'$.checkedAt') DESC LIMIT 100").all<{payload:string}>();return rows.results.map(r=>JSON.parse(r.payload));}
export async function publishBroadcastRecapsStep(gameId?:string){
 const rows=(await readBroadcastRecaps()).filter(r=>r.status==='queued'&&(!gameId||r.gameId===gameId)).slice(0,2),checks=[];
 for(const picked of rows){try{
  const snapshot=await readBroadcastRecap(picked.id);if(!snapshot||snapshot.row.bodyHash!==picked.bodyHash)continue;const row=snapshot.row;if(row.analysis?.status==='publishing'&&Number(row.analysis.leaseUntil)>Date.now())continue;
  if(!row.text){await env.DB!.prepare("UPDATE operations_health SET payload=? WHERE key=? AND payload=?").bind(JSON.stringify({...row,status:'empty-description',videoAnalysis:row.videoAnalysis==='not-connected'?'awaiting-review':row.videoAnalysis||'awaiting-review'}),prefix+row.id,snapshot.payload).run();checks.push({id:row.id,status:'limited',error:'Publisher description empty; reviewed transcript or frame evidence is needed'});continue;}
  const base=await readBaseData({ids:[row.id]});if(!base.persistent)throw Error('Original recap storage unavailable');const old=base.entries.find(e=>e.id===row.id),existing=old?.sourceBodies?.[row.locale as Locale];
  if(existing?.bodyHash!==row.bodyHash){
   const title={...(old?.title||localized('','','',''))};title[row.locale as Locale]=row.title;
   const entry:Entry={...old,id:row.id,gameId:row.gameId,region:row.region,server:row.region,kind:'update',title,summary:old?.summary||localized('','','',''),sourceUrl:row.sourceUrl,sourceTitle:row.title,sourceLocale:row.locale,sourceKind:'video',officialLocales:[row.locale],translatedLocales:[],startAt:null,endAt:null,publishedAt:row.publishedAt,verifiedAt:row.checkedAt,sourceBodies:{...old?.sourceBodies,[row.locale]:{title:row.title,locale:row.locale,sourceUrl:row.sourceUrl,text:row.text,images:[],bodyHash:row.bodyHash,importedAt:row.checkedAt,sourceKind:'official'}}};
   await saveEntryChanges([{before:old,after:entry}]);
  }
  const check=await readBaseData({ids:[row.id]});if(check.entries[0]?.sourceBodies?.[row.locale as Locale]?.bodyHash!==row.bodyHash)throw Error('Recap readback failed');
  // CAS prevents an updated description being marked complete by an older worker.
  const saved=await env.DB!.prepare("UPDATE operations_health SET payload=? WHERE key=? AND payload=?").bind(JSON.stringify({...row,status:'published',publishedEntryId:row.id,importedAt:new Date().toISOString(),evidence:'official-description',videoAnalysis:row.videoAnalysis==='not-connected'?'awaiting-review':row.videoAnalysis||'awaiting-review',watched:false}),prefix+row.id,snapshot.payload).run();
  checks.push({id:row.id,status:saved.meta.changes?'ok':'limited',descriptionPublished:!!saved.meta.changes,videoAnalyzed:false});
 }catch(e){checks.push({id:picked.id,status:'error',error:e instanceof Error?e.message:'Recap publication failed'});}}
 const analysisChecks=await publishReviewedBroadcastAnalyses(reviewedAnalyses,gameId),allChecks=[...checks,...analysisChecks];
 return {source:'broadcasts/recaps',status:allChecks.some(c=>c.status==='error')?'error':allChecks.some(c=>c.status==='limited')?'limited':'ok',checkedAt:new Date().toISOString(),checks,analysisChecks,videoAnalysis:broadcastAnalysisStatus,automaticVideoInference:false};
}
