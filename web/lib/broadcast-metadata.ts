import type {OfficialBroadcast} from './types';
export function embeddedJson(html:string,name:string):any{
 const match=new RegExp('(?:var\\s+|window\\.)?'+name+'\\s*=\\s*').exec(html);if(!match)return null;
 const start=match.index+match[0].length;let depth=0,quoted=false,escape=false;
 for(let i=start;i<html.length;i++){
  const c=html[i];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue;}
  if(c==='"')quoted=true;else if(c==='{'||c==='[')depth++;else if(c==='}'||c===']'){depth--;if(!depth){try{return JSON.parse(html.slice(start,i+1));}catch{return null;}}}
 }return null;
}
export function channelVideos(html:string):{channelId:string;ids:string[]}{
 const data=embeddedJson(html,'ytInitialData');const ids=new Set<string>();
 function walk(x:any){if(!x||typeof x!=='object')return;if(x.videoRenderer?.videoId)ids.add(x.videoRenderer.videoId);if(x.lockupViewModel?.contentId)ids.add(x.lockupViewModel.contentId);for(const v of Object.values(x))if(v&&typeof v==='object')walk(v);}
 walk(data);return {channelId:data?.metadata?.channelMetadataRenderer?.externalId||'',ids:[...ids].filter(x=>/^[\w-]{11}$/.test(x)).slice(0,3)};
}
export function readBroadcast(html:string,id:string,channelId:string,locale:OfficialBroadcast['locale'],checkedAt:string,old?:OfficialBroadcast):OfficialBroadcast|null{
 const p=embeddedJson(html,'ytInitialPlayerResponse'),v=p?.videoDetails,m=p?.microformat?.playerMicroformatRenderer,l=m?.liveBroadcastDetails;
 // LOGIN_REQUIRED, deleted/private videos, premieres and player failures are not cancellation/end evidence.
 if(!v||v.videoId!==id||v.channelId!==channelId||!v.isLiveContent||!l||!['OK','LIVE_STREAM_OFFLINE'].includes(p?.playabilityStatus?.status))return null;
 const clock=(x:unknown)=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x))?x:null;
 const endedAt=clock(l.endTimestamp),start=clock(l.startTimestamp);
 const status=endedAt?'ended':l.isLiveNow===true?'live':p.playabilityStatus.status==='LIVE_STREAM_OFFLINE'&&v.isUpcoming===true&&start?'scheduled':null;
 if(!status)return null;
 if(old&&old.youtubeId!==id)return null;
 const url='https://www.youtube.com/watch?v='+id;
 const next:OfficialBroadcast={...(old||{}),status,youtubeId:id,channel:v.author,locale,sourceUrl:url,announcementUrl:old?.announcementUrl||url,originalTitle:v.title,announcedAt:old?.announcedAt||clock(m.publishDate),scheduledAt:status==='scheduled'?start:old?.scheduledAt||null,actualStartAt:status!=='scheduled'?start:old?.actualStartAt||null,endedAt,official:true,metadataVerified:true,watched:false,verifiedAt:old?.verifiedAt||checkedAt,statusCheckedAt:checkedAt};
 const strip=(b:OfficialBroadcast)=>({...b,statusCheckedAt:undefined,verifiedAt:undefined});
 if(!old||JSON.stringify(strip(old))!==JSON.stringify(strip(next)))next.verifiedAt=checkedAt;
 return next;
}
