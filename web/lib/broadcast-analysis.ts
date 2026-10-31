import {z} from 'zod';
import {broadcastRecapSchema,safeExtras} from './content-schema';
import {env} from 'cloudflare:workers';
import {readBaseData,readEditorial,readEntry,saveEntryChanges} from './store';
import {safeSource,localized,type Entry,type Localized,type Locale,type Region} from './types';
import {isSupportedSchedule} from './games';
const locales=['ko','en','ja','zh'] as const;
const copy=(max:number)=>z.object({ko:z.string().max(max),en:z.string().max(max),ja:z.string().max(max),zh:z.string().max(max)}).strict().refine(v=>Object.values(v).some(t=>t.trim()),'Missing factual copy');
const sha=z.string().regex(/^[a-f0-9]{64}$/),stamp=z.string().datetime({offset:true});
const publicUrl=z.string().max(2000).refine(s=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!/^(?:localhost|.*\.localhost|.*\.local|.*\.internal|\d+(?:\.\d+){3}|\[)/i.test(u.hostname)}catch{return false}},'Public HTTPS source required');
export const broadcastReviewSchema=z.object({action:z.literal('review'),id:z.string().regex(/^recap-[a-z0-9]+-(?:ko|en|ja|zh)-[\w-]{11}$/),bodyHash:sha,review:z.object({feature:broadcastRecapSchema.optional(),version:z.literal(1),youtubeId:z.string().regex(/^[\w-]{11}$/),sourceUrl:publicUrl,reviewedAt:stamp,method:z.enum(['transcript','frames','transcript-and-frames','source-summary']),title:copy(240).optional(),summary:copy(1000),segments:z.array(z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),title:copy(240),body:copy(5000),evidence:z.object({kind:z.enum(['transcript','frame','official-page','community-page']),sourceUrl:publicUrl,startSeconds:z.number().int().min(0).max(43200).optional(),endSeconds:z.number().int().min(0).max(43200).optional(),transcriptHash:sha.optional(),frameHash:sha.optional(),visualChecked:z.literal(true).optional()}).strict()}).strict()).min(1).max(30)}).strict()}).strict();
export type BroadcastReview=z.infer<typeof broadcastReviewSchema>;
export type BroadcastRecapRow={id:string;gameId:string;region:Region;locale:Locale;youtubeId:string;sourceUrl:string;channel?:string;channelId?:string;title:string;text:string;bodyHash:string;checkedAt:string;actualEndAt:string;publishedAt:string|null;official?:boolean;metadataVerified?:boolean;durationSeconds?:number;status:string;analysis?:Record<string,any>;videoAnalysis?:string;[key:string]:unknown};
export const broadcastAnalysisStatus='review-workflow-connected';
export const broadcastFrameKey=(hash:string)=>'broadcast-evidence/v1/frames/'+hash;
export const broadcastFrameBindingKey=(id:string,bodyHash:string,seconds:number,hash:string)=>`broadcast-evidence/v1/bindings/${id}/${bodyHash}/${seconds}-${hash}`;
export const broadcastDigest=async(bytes:Uint8Array)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as Uint8Array<ArrayBuffer>))].map(n=>n.toString(16).padStart(2,'0')).join('');
export class BroadcastReviewError extends Error{constructor(message:string,readonly status=400){super(message)}}
const prefix='broadcast-recap:';
export async function readBroadcastRecap(id:string){const value=await env.DB!.prepare('SELECT payload FROM operations_health WHERE key=?').bind(prefix+id).first<{payload:string}>();return value?{payload:value.payload,row:JSON.parse(value.payload) as BroadcastRecapRow}:null;}
/** Old queues predate explicit provenance flags. Upgrade only from the saved,
 * owner-applied exact official ended broadcast, never from a review assertion. */
export async function readVerifiedBroadcastRecap(id:string){
 const source=await readBroadcastRecap(id);if(!source||source.row.official===true&&source.row.metadataVerified===true)return source;
 if(source.row.official===false||source.row.metadataVerified===false)return source;
 const base=await readBaseData({gameId:source.row.gameId});if(!base.persistent)throw new BroadcastReviewError('Original broadcast provenance unavailable',503);
 const matches=(entry:Entry|undefined)=>!!entry&&!entry.hidden&&entry.gameId===source.row.gameId&&entry.region===source.row.region&&entry.broadcast?.official===true&&entry.broadcast.metadataVerified===true&&entry.broadcast.status==='ended'&&entry.broadcast.youtubeId===source.row.youtubeId&&entry.broadcast.locale===source.row.locale&&entry.broadcast.sourceUrl===source.row.sourceUrl&&entry.broadcast.endedAt===source.row.actualEndAt&&entry.broadcast.originalTitle===source.row.title;
 const original=base.entries.find(matches);if(!original)return source;const effective=await readEntry(original.id,{includeHidden:true,requirePersistent:true});if(!matches(effective))return source;
 const next={...source.row,official:true,metadataVerified:true,channelId:effective!.broadcast!.channelId};
 const updated=await env.DB!.prepare('UPDATE operations_health SET payload=? WHERE key=? AND payload=?').bind(JSON.stringify(next),prefix+id,source.payload).run();
 return updated.meta.changes?{payload:JSON.stringify(next),row:next}:await readBroadcastRecap(id);
}
export function validEndedRecap(row:BroadcastRecapRow){return row.official===true&&row.metadataVerified===true&&row.id===`recap-${row.gameId}-${row.locale}-${row.youtubeId}`&&/^[\w-]{11}$/.test(row.youtubeId)&&isSupportedSchedule(row.gameId,row.region)&&Number.isFinite(Date.parse(row.actualEndAt))&&Date.parse(row.actualEndAt)<=Date.now()+300000&&videoIdentity(row.sourceUrl)===row.youtubeId;}
export function videoIdentity(url:string){try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.port)return;return ['youtube.com','www.youtube.com'].includes(u.hostname)?u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:live|embed)\/([\w-]{11})$/)?.[1]:u.hostname==='youtu.be'?u.pathname.slice(1):undefined}catch{return;}}
function clipUrl(row:BroadcastRecapRow,seconds:number){const u=new URL('https://www.youtube.com/watch');u.searchParams.set('v',row.youtubeId);u.searchParams.set('t',String(seconds));return u.href;}
export function validateBroadcastReview(input:BroadcastReview,row:BroadcastRecapRow){
 if(!validEndedRecap(row)||input.id!==row.id||input.bodyHash!==row.bodyHash)throw new BroadcastReviewError('Ended broadcast or source revision changed',409);
 if(input.review.youtubeId!==row.youtubeId||input.review.sourceUrl!==row.sourceUrl)throw new BroadcastReviewError('Broadcast identity mismatch');
 if(Date.parse(input.review.reviewedAt)>Date.now()+300000||Date.parse(input.review.reviewedAt)<Date.parse(row.actualEndAt)-300000)throw new BroadcastReviewError('Review time does not follow the ended broadcast');
 if(new Set(input.review.segments.map(s=>s.id)).size!==input.review.segments.length)throw new BroadcastReviewError('Duplicate evidence segment');
 const feature=input.review.feature;if(feature&&(feature.youtubeId!==row.youtubeId||feature.reviewedAt!==input.review.reviewedAt||!safeExtras({gameId:row.gameId,kind:'update',sourceUrl:row.sourceUrl,broadcastRecap:feature} as Entry)))throw new BroadcastReviewError('Invalid special recap feature provenance or window');
 const kinds=new Set(input.review.segments.map(s=>s.evidence.kind)),method=input.review.method;
 if(method==='transcript'&&([...kinds].some(k=>!['transcript','official-page','community-page'].includes(k))||!kinds.has('transcript'))||method==='frames'&&([...kinds].some(k=>!['frame','official-page','community-page'].includes(k))||!kinds.has('frame'))||method==='transcript-and-frames'&&(!kinds.has('transcript')||!kinds.has('frame'))||method==='source-summary'&&[...kinds].some(k=>!['official-page','community-page'].includes(k)))throw new BroadcastReviewError('Review method does not match its evidence');
 for(const s of input.review.segments){const e=s.evidence;
  if(e.kind==='transcript'||e.kind==='frame'){
   if(videoIdentity(e.sourceUrl)!==row.youtubeId||e.startSeconds===undefined||e.startSeconds>(row.durationSeconds||43200)||e.endSeconds!==undefined&&(e.endSeconds<e.startSeconds||e.endSeconds>(row.durationSeconds||43200)))throw new BroadcastReviewError('Video evidence time or identity mismatch');
   if(e.kind==='transcript'&&!e.transcriptHash)throw new BroadcastReviewError('Transcript evidence needs its exact hash');
   if(e.kind==='frame'&&(!e.frameHash||!e.visualChecked))throw new BroadcastReviewError('Frame evidence requires an inspected original');
  }else if(e.startSeconds!==undefined||e.endSeconds!==undefined||e.frameHash||e.transcriptHash)throw new BroadcastReviewError('Page evidence cannot claim video inspection');
  if(e.kind==='official-page'&&!safeSource(e.sourceUrl,row.gameId))throw new BroadcastReviewError('Official evidence does not match a reviewed game source');
 }
}
export async function broadcastFrameMetadata(hash:string,row:BroadcastRecapRow,seconds:number){
 const [saved,binding]=await Promise.all([env.BUCKET?.head(broadcastFrameKey(hash)),env.BUCKET?.head(broadcastFrameBindingKey(row.id,row.bodyHash,seconds,hash))]),m=saved?.customMetadata,b=binding?.customMetadata;
 if(!saved||!m||!b||m.sha256!==hash||b.sha256!==hash||b.recapId!==row.id||b.bodyHash!==row.bodyHash||b.youtubeId!==row.youtubeId||Number(b.timeSeconds)!==seconds||!['image/png','image/jpeg'].includes(m.contentType)||saved.size<1||saved.size>8*1024*1024)throw new BroadcastReviewError('Exact frame is not stored for this broadcast revision');
 const width=Number(m.width),height=Number(m.height);if(!Number.isInteger(width)||!Number.isInteger(height)||width<240||height<135||width*height>16777216)throw new BroadcastReviewError('Stored frame dimensions are invalid');
 return {hash,width,height,contentType:m.contentType,bytes:saved.size};
}
export async function submitBroadcastReview(raw:unknown){
 if(new TextEncoder().encode(JSON.stringify(raw)).length>256000)throw new BroadcastReviewError('Review body exceeds bound',413);
 const input=broadcastReviewSchema.parse(raw),source=await readVerifiedBroadcastRecap(input.id);if(!source)throw new BroadcastReviewError('Broadcast recap not found',404);const row=source.row;validateBroadcastReview(input,row);
 const reviewHash=await broadcastDigest(new TextEncoder().encode(JSON.stringify(input.review))),previous=row.analysis;
 if(previous?.reviewHash===reviewHash&&previous?.status==='published')return {ok:true,reused:true,id:row.id,reviewHash,videoWatched:false};
 if(previous?.status==='publishing'&&Number(previous.leaseUntil)>Date.now())throw new BroadcastReviewError('A broadcast review is already publishing',409);
 const frames=[];for(const s of input.review.segments)if(s.evidence.kind==='frame')frames.push({...await broadcastFrameMetadata(s.evidence.frameHash!,row,s.evidence.startSeconds!),segment:s});
 if(frames.length>8)throw new BroadcastReviewError('At most eight inspected frames per review');
 const before=await readBaseData({ids:[row.id]});if(!before.persistent)throw new BroadcastReviewError('Full recap original unavailable',503);
 const old=before.entries.find(e=>e.id===row.id);if(old&&(old.gameId!==row.gameId||old.region!==row.region))throw new BroadcastReviewError('Stored recap identity mismatch',409);
 if(old){const effective=await readEntry(row.id,{includeHidden:true,requirePersistent:true});if(!effective||effective.gameId!==row.gameId||effective.region!==row.region)throw new BroadcastReviewError('Owner recap identity differs from this broadcast',409);}
 const claim={...row,videoAnalysis:'publishing',analysis:{...previous,status:'publishing',reviewHash,leaseUntil:Date.now()+120000,review:input.review}};
 const leased=await env.DB!.prepare('UPDATE operations_health SET payload=? WHERE key=? AND payload=?').bind(JSON.stringify(claim),prefix+row.id,source.payload).run();if(!leased.meta.changes)throw new BroadcastReviewError('Broadcast source changed before publication',409);
 try{
  const expectedSections=input.review.segments.map(s=>({title:s.title,body:s.body,sourceKind:(s.evidence.kind==='community-page'?'community':s.evidence.kind==='official-page'?'official':'video') as 'community'|'official'|'video',sourceUrls:[s.evidence.startSeconds!==undefined?clipUrl(row,s.evidence.startSeconds):s.evidence.sourceUrl]}));
  const generatedBefore=(previous?.publishedSections||[]) as NonNullable<Entry['detailSections']>,retained=(old?.detailSections||[]).filter(s=>![...generatedBefore,...expectedSections].some(p=>JSON.stringify(p)===JSON.stringify(s))),title={...(old?.title||localized('','','',''))};
  for(const l of locales)if(!title[l])title[l]=input.review.title?.[l]||(l===row.locale?row.title:'');
  const related=[...old?.relatedSources||[],...input.review.segments.map(s=>({kind:(s.evidence.kind==='community-page'?'community':s.evidence.kind==='official-page'?'official':'video') as 'community'|'official'|'video',url:s.evidence.startSeconds!==undefined?clipUrl(row,s.evidence.startSeconds):s.evidence.sourceUrl,title:row.title,publisher:s.evidence.kind==='community-page'||s.evidence.kind==='official-page'?new URL(s.evidence.sourceUrl).hostname:row.channel}))];
  const frameAssets=frames.map(f=>({image:'/api/broadcast-frames/'+f.hash,imageSource:clipUrl(row,f.segment.evidence.startSeconds!),imageVerified:true,imageLocale:row.locale,width:f.width,height:f.height,verifiedAt:input.review.reviewedAt,imageCaption:f.segment.title}));
  const oldFrames=new Set((previous?.publishedFrameHashes||[]).map((h:string)=>'/api/broadcast-frames/'+h));
  const entry:Entry={...old,...input.review.feature?{broadcastRecap:input.review.feature}:{},id:row.id,gameId:row.gameId,region:row.region,server:row.region,kind:'update',title,summary:input.review.summary,sourceUrl:old?.sourceUrl||row.sourceUrl,sourceTitle:old?.sourceTitle||row.title,sourceLocale:old?.sourceLocale||row.locale,sourceKind:old?.sourceKind||'video',officialLocales:old?.officialLocales||[row.locale],translatedLocales:[...new Set([...old?.translatedLocales||[],...locales.filter(l=>l!==row.locale&&!!input.review.summary[l])])],startAt:old?.startAt??null,endAt:old?.endAt??null,publishedAt:old?.publishedAt||row.publishedAt,verifiedAt:input.review.reviewedAt,detailSections:[...retained,...expectedSections],detailImages:[...(old?.detailImages||[]).filter(a=>!oldFrames.has(a.image)),...frameAssets],relatedSources:[...new Map(related.map(s=>[s.url,s])).values()].slice(0,40)};
  await saveEntryChanges([{before:old,after:entry}]);
  const check=await readBaseData({ids:[row.id]});if(!check.persistent)throw new Error('Recap analysis readback unavailable');const saved=check.entries.find(e=>e.id===row.id);if(!saved)throw new Error('Recap analysis readback missing');
  let editorialAvailable=true;const editorial=await readEditorial('entry:'+row.id,()=>{editorialAvailable=false});if(!editorialAvailable)throw new Error('Owner fields readback unavailable');const ownerPatch=editorial[0]?.payload||{},protectedFields=new Set([...Object.keys(ownerPatch).filter(k=>k!=='$unset'),...(Array.isArray(ownerPatch.$unset)?ownerPatch.$unset.filter((k):k is string=>typeof k==='string'):[])]);
  if(!protectedFields.has('detailSections')&&!expectedSections.every(s=>saved.detailSections?.some(p=>JSON.stringify(p)===JSON.stringify(s))))throw new Error('Recap analysis sections readback mismatch');
  if(input.review.feature&&!protectedFields.has('broadcastRecap')&&JSON.stringify(saved.broadcastRecap)!==JSON.stringify(input.review.feature))throw new Error('Special recap feature readback mismatch');
  if(!protectedFields.has('summary')&&JSON.stringify(saved.summary)!==JSON.stringify(input.review.summary))throw new Error('Recap analysis summary readback mismatch');
  if(!protectedFields.has('detailImages')&&!frameAssets.every(a=>saved.detailImages?.some(v=>JSON.stringify(v)===JSON.stringify(a))))throw new Error('Recap frame readback mismatch');
  const status=ownerPatch.hidden===true||protectedFields.has('detailSections')&&protectedFields.has('summary')?'owner-protected':'published',next={...row,status:status==='published'&&row.status==='awaiting-review'?'published':row.status,publishedEntryId:row.id,analysis:{status,reviewHash,review:input.review,publishedSections:protectedFields.has('detailSections')?generatedBefore:expectedSections,publishedFrameHashes:protectedFields.has('detailImages')?previous?.publishedFrameHashes||[]:frames.map(f=>f.hash),publishedAt:new Date().toISOString(),protectedFields:[...protectedFields]},videoAnalysis:status==='published'?'reviewed':'owner-protected'};
  const finished=await env.DB!.prepare('UPDATE operations_health SET payload=? WHERE key=? AND payload=?').bind(JSON.stringify(next),prefix+row.id,JSON.stringify(claim)).run();if(!finished.meta.changes)throw new BroadcastReviewError('Analysis source checkpoint changed; recheck saved original',409);
  return {ok:true,id:row.id,reviewHash,status,segmentCount:expectedSections.length,frameCount:frames.length,protectedFields:[...protectedFields],videoWatched:false};
 }catch(error){const failed={...row,analysis:{...previous,status:'retry',reviewHash,review:input.review},videoAnalysis:'review-retry'};await env.DB!.prepare('UPDATE operations_health SET payload=? WHERE key=? AND payload=?').bind(JSON.stringify(failed),prefix+row.id,JSON.stringify(claim)).run();throw error;}
}
export async function boundedBroadcastBody(request:Request,limit=256000){
 if(Number(request.headers.get('content-length')||0)>limit)throw new BroadcastReviewError('Review body exceeds bound',413);const reader=request.body?.getReader();if(!reader)return null;const chunks:Uint8Array[]=[];let size=0;try{while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>limit)throw new BroadcastReviewError('Review body exceeds bound',413);chunks.push(p.value);}}finally{await reader.cancel().catch(()=>{});}if(!size)return null;const body=new Uint8Array(size);let at=0;for(const c of chunks){body.set(c,at);at+=c.length;}return JSON.parse(new TextDecoder().decode(body));
}

export const reviewedBroadcastReceiptSchema=z.object({gameId:z.string().regex(/^[a-z0-9]+$/),region:z.enum(['global','kr','jp','cn']),locale:z.enum(locales),broadcastDate:z.string().date(),expectedOriginalTitle:z.string().min(1).max(600),expiresAt:stamp,review:broadcastReviewSchema.shape.review}).strict();
async function reviewedReceiptQueue(receipt:z.infer<typeof reviewedBroadcastReceiptSchema>){
 const id=`recap-${receipt.gameId}-${receipt.locale}-${receipt.review.youtubeId}`,existing=await readVerifiedBroadcastRecap(id);if(existing)return existing;
 const base=await readBaseData({gameId:receipt.gameId});if(!base.persistent)throw new BroadcastReviewError('Persistent ended broadcast authority unavailable',503);
 const matches=(entry:Entry|undefined)=>!!entry&&!entry.hidden&&entry.gameId===receipt.gameId&&entry.region===receipt.region&&entry.broadcast?.official===true&&entry.broadcast.metadataVerified===true&&entry.broadcast.status==='ended'&&entry.broadcast.youtubeId===receipt.review.youtubeId&&entry.broadcast.locale===receipt.locale&&entry.broadcast.sourceUrl===receipt.review.sourceUrl&&entry.broadcast.originalTitle===receipt.expectedOriginalTitle&&!!entry.broadcast.endedAt&&Date.parse(entry.broadcast.endedAt)<=Date.now()+300000&&Date.parse(entry.broadcast.endedAt)>=Date.now()-14*86400000;
 const original=base.entries.find(matches);if(!original)return null;const effective=await readEntry(original.id,{includeHidden:true,requirePersistent:true});if(!matches(effective))return null;
 const b=effective!.broadcast!,body=effective!.sourceBodies?.[receipt.locale],text=body?.sourceKind==='official'&&body.sourceUrl===b.sourceUrl?body.text.trim().slice(0,50000):'',publishedAt=effective!.publishedAt||null;
 const bodyHash=await broadcastDigest(new TextEncoder().encode(JSON.stringify({title:b.originalTitle,text,publishedAt}))),row:BroadcastRecapRow={id,gameId:receipt.gameId,region:receipt.region,locale:receipt.locale,youtubeId:b.youtubeId!,sourceUrl:b.sourceUrl,channel:b.channel,channelId:b.channelId,title:b.originalTitle,text,publishedAt,actualEndAt:b.endedAt!,official:true,metadataVerified:true,watched:false,bodyHash,checkedAt:b.statusCheckedAt||b.verifiedAt,queuedAt:new Date().toISOString(),status:'awaiting-review',videoAnalysis:'awaiting-review',sourceProof:'persisted-ended-broadcast',descriptionAccess:text?'stored-official-body':'unavailable'};
 const payload=JSON.stringify(row),saved=await env.DB!.prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(prefix+id,payload).run();return saved.meta.changes?{row,payload}:await readVerifiedBroadcastRecap(id);
}
/** Checked source receipts do not create broadcasts or manufacture an ended state.
 * They bind the current exact queue revision and use the same guarded publisher. */
export async function publishReviewedBroadcastAnalyses(raw:unknown,gameId?:string){
 const receipts=z.array(reviewedBroadcastReceiptSchema).max(40).parse(raw),checks=[];
 for(const receipt of receipts.filter(r=>!gameId||r.gameId===gameId)){
  const id=`recap-${receipt.gameId}-${receipt.locale}-${receipt.review.youtubeId}`;if(Date.parse(receipt.expiresAt)<Date.now())continue;
  let source;try{source=await reviewedReceiptQueue(receipt)}catch(error){checks.push({id,status:'error',error:error instanceof BroadcastReviewError?error.message:'Ended broadcast authority unavailable'});continue;}if(!source){checks.push({id,status:'limited',error:'No matching persisted official ended broadcast with an actual end time'});continue;}const row=source.row;
  const expiry=Date.parse(receipt.expiresAt),reviewed=Date.parse(receipt.review.reviewedAt),day=Date.parse(receipt.broadcastDate+'T00:00:00Z'),ended=Date.parse(row.actualEndAt);
  if(expiry<Date.now())continue;
  if(expiry-reviewed>14*86400000||expiry<reviewed){checks.push({id,status:'limited',error:'Reviewed evidence receipt expired or exceeds fourteen-day window'});continue;}
  if(row.gameId!==receipt.gameId||row.region!==receipt.region||row.locale!==receipt.locale||row.title!==receipt.expectedOriginalTitle||!Number.isFinite(ended)||ended<day||ended>=day+2*86400000){checks.push({id,status:'limited',error:'Reviewed source receipt does not match the exact ended broadcast'});continue;}
  try{const result=await submitBroadcastReview({action:'review',id,bodyHash:row.bodyHash,review:receipt.review});if(!('reused'in result))checks.push({...result,status:result.status==='published'?'ok':'limited'});}
  catch(error){checks.push({id,status:error instanceof BroadcastReviewError&&error.status===409?'limited':'error',error:error instanceof BroadcastReviewError?error.message:'Reviewed broadcast publication failed'});}
 }
 return checks;
}
