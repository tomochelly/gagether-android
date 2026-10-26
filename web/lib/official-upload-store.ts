import {readOfficialChannels,saveOfficialChannels} from './official-social-store';
import {readBaseData,saveEntries,saveEntryChanges} from './store';
import {channelVideos} from './broadcast-metadata';
import {channelUploads,rssUploads,uploadEntry,uploadPosts,type Upload} from './official-uploads';
import {sameEditValue} from './inline-edit';
import {retryFetch} from './retry-fetch';
async function body(url:string){const r=await retryFetch(url,{redirect:'follow',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('HTTP '+r.status);const s=await r.text();if(!s.trim()||s.length>5000000)throw Error('Empty or excessive upload metadata');return s;}
/** Registered official channels only; bounded checkpoint stage, isolated from livestream status. */
export async function refreshOfficialUploadsStep(cursor=0,fetchBody=body,gameId?:string){
 const channels=(await readOfficialChannels(gameId)).filter(c=>c.platform==='youtube'&&c.official).sort((a,b)=>Number(b.locale==='ko')-Number(a.locale==='ko')||a.id.localeCompare(b.id)),checks:any[]=[];
 for(const c of channels.slice(cursor,cursor+3)){
  const checkedAt=new Date().toISOString(),base=c.url.replace(/\/(?:videos|streams)\/?$/,'').replace(/\/$/,'');let feedError:string|undefined,shortsError:string|undefined;
  try{
   let id=/\/channel\/(UC[\w-]+)$/.exec(base)?.[1],listing:string|undefined;
   if(!id){listing=await fetchBody(base+'/videos?hl='+c.locale);id=channelVideos(listing).channelId;if(!/^UC[\w-]+$/.test(id))throw Error('Official upload channel identity unavailable');}
   let uploads:Upload[]=[];
   try{uploads=rssUploads(await fetchBody('https://www.youtube.com/feeds/videos.xml?channel_id='+id),id);if(!uploads.length)throw Error('Empty official upload feed');}catch(e){feedError=e instanceof Error?e.message:'Upload feed unavailable';uploads=channelUploads(listing||await fetchBody(base+'/videos?hl='+c.locale),id);if(!uploads.length)throw Error('No readable official uploads');}
   if(c.gameId==='wuwa')try{const shorts=channelUploads(await fetchBody(base+'/shorts?hl='+c.locale),id);uploads=[...new Map([...uploads,...shorts].map(u=>[u.youtubeId,u])).values()].slice(0,24);}catch(e){shortsError=e instanceof Error?e.message:'Shorts listing unavailable';}
   const candidates=uploads.map(u=>({u,id:`official-video-${c.gameId}-${c.locale}-${u.youtubeId}`})),stored=await readBaseData({ids:candidates.map(v=>v.id)});if(!stored.persistent)throw Error('Saved upload originals unavailable');
   const changes=candidates.flatMap(({u,id})=>{const old=stored.entries.find(e=>e.id===id),next=uploadEntry(c,u,checkedAt,old);return next&&(!old||!sameEditValue(old,next))?[next]:[];});
   await saveEntryChanges(changes.map(after=>({before:stored.entries.find(e=>e.id===after.id),after})));
   const readback=changes.length?await readBaseData({ids:changes.map(e=>e.id)}):{entries:[],persistent:true};if(!readback.persistent||changes.some(e=>!readback.entries.some(v=>v.id===e.id&&v.videos?.some(x=>x.youtubeId===e.videos![0].youtubeId))))throw Error('Official PV readback failed');
   const posts=uploadPosts(c,uploads,checkedAt),status=shortsError?'error':'ok';
   await saveOfficialChannels([{...c,checkedAt,status,posts:(shortsError?[...posts,...c.posts.filter(p=>!posts.some(n=>(n.youtubeId||n.url)===(p.youtubeId||p.url)))]:posts).slice(0,12)}]);
   checks.push({source:'youtube-uploads/'+c.id,url:base+'/videos?hl='+c.locale,gameId:c.gameId,checkedAt,status,count:uploads.length,added:changes.length,...(shortsError?{shortsError,shortsStatus:'error',partial:true}:c.gameId==='wuwa'?{shortsStatus:'ok'}:{}),...(feedError?{feedFallback:feedError}:{}),watched:false});
  }catch(e){await saveOfficialChannels([{...c,checkedAt,status:'error'}]);checks.push({source:'youtube-uploads/'+c.id,url:base+'/videos?hl='+c.locale,gameId:c.gameId,checkedAt,status:'error',error:e instanceof Error?e.message:'Official uploads unavailable'});}
 }
 const nextCursor=Math.min(cursor+3,channels.length);return {checks,nextCursor,total:channels.length,done:nextCursor>=channels.length};
}
