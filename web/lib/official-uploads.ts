import {embeddedJson} from './broadcast-metadata';
import {localized,type Entry,type VideoClip,type Locale} from './types';
import type {OfficialChannel,OfficialPost} from './official-social';
export type Upload={youtubeId:string;title:string;channelId:string;thumbnailUrl?:string;publishedAt?:string;publishedDate?:string;recent:boolean};
const text=(v:any):string=>typeof v==='string'?v:v?.simpleText||v?.runs?.map((r:any)=>r.text||'').join('')||'';
const decode=(s:string)=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&(?:amp|lt|gt|quot|apos);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"})[m]!).replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n)));
export function recentUploadLabel(label:string){
 // Relative labels establish only a bounded discovery window, never a publication clock.
 const m=label.match(/(\d+)\s*(minute|hour|day|분|시간|일|分|時間|日|分钟|小時|小时|天)/i);if(!m)return /just now|방금|たった今|刚刚/.test(label);
 const unit=m[2],n=Number(m[1]);return /^(minute|분|分|分钟)$/i.test(unit)?n<=7*1440:/^(hour|시간|時間|小時|小时)$/i.test(unit)?n<=7*24:n<=7;
}
function thumb(values:any[],id:string){return [...values||[]].filter(v=>typeof v.url==='string'&&v.url.startsWith('https://i.ytimg.com/vi/'+id+'/')).sort((a,b)=>(b.width||0)-(a.width||0))[0]?.url;}
export function channelUploads(html:string,expected:string):Upload[]{
 const d=embeddedJson(html,'ytInitialData'),channelId=d?.metadata?.channelMetadataRenderer?.externalId;
 if(channelId!==expected)throw Error('Official upload channel identity mismatch');
 const rows=new Map<string,Upload>();
 function walk(x:any){if(!x||typeof x!=='object')return;const v=x.videoRenderer||x.gridVideoRenderer;
  if(v&&/^[\w-]{11}$/.test(v.videoId)&&!v.upcomingEventData&&!v.badges?.some((b:any)=>/LIVE|UPCOMING/i.test(b.metadataBadgeRenderer?.style||''))){const title=text(v.title);if(title)rows.set(v.videoId,{youtubeId:v.videoId,title,channelId,thumbnailUrl:thumb(v.thumbnail?.thumbnails,v.videoId),recent:recentUploadLabel(text(v.publishedTimeText))});}
  const lock=x.lockupViewModel;
  if(lock&&/^[\w-]{11}$/.test(lock.contentId)){const meta=lock.metadata?.lockupMetadataViewModel,title=text(meta?.title?.content),bits=meta?.metadata?.contentMetadataViewModel?.metadataRows?.flatMap((r:any)=>r.metadataParts?.map((p:any)=>text(p.text?.content))||[])||[];if(title)rows.set(lock.contentId,{youtubeId:lock.contentId,title,channelId,thumbnailUrl:thumb(lock.contentImage?.thumbnailViewModel?.image?.sources,lock.contentId),recent:bits.some(recentUploadLabel)});}
  for(const v of Object.values(x))if(v&&typeof v==='object')walk(v);
 }walk(d?.contents);return [...rows.values()].slice(0,12);
}
export function rssUploads(xml:string,expected:string,now=Date.now()):Upload[]{
 const channel=/<yt:channelId>([^<]+)<\/yt:channelId>/.exec(xml)?.[1];if(channel!==expected)throw Error('Official upload feed identity mismatch');
 const rows:Upload[]=[];for(const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)){const s=m[1],id=/<yt:videoId>([^<]+)<\/yt:videoId>/.exec(s)?.[1],channelId=/<yt:channelId>([^<]+)<\/yt:channelId>/.exec(s)?.[1],title=decode(/<title>([\s\S]*?)<\/title>/.exec(s)?.[1]||''),at=/<published>([^<]+)<\/published>/.exec(s)?.[1];if(channelId!==expected||!id||!/^[-\w]{11}$/.test(id)||!title||!at||!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(at)||!Number.isFinite(Date.parse(at)))continue;const url=/<media:thumbnail[^>]+url="([^"]+)"/.exec(s)?.[1];rows.push({youtubeId:id,title,channelId,publishedAt:at,thumbnailUrl:url?.startsWith('https://i.ytimg.com/vi/'+id+'/')?decode(url):undefined,recent:Date.parse(at)<=now&&now-Date.parse(at)<=7*86400000});}return rows.slice(0,12);
}
export function uploadKind(title:string):Pick<VideoClip,'kind'|'format'>|undefined{
 if(/ASMR|OST|\bEP\b|음원|主題歌|主题曲|코스튬|衣装|時装|时装|costume|outfit|skin trailer/i.test(title))return;
 if(/전투 모션|전투.*시연|combat showcase|実戦トレーラー|战斗演示/i.test(title))return {kind:'character',format:'demo'};
 if(/캐릭터.{0,8}(PV|트레일러|소개)|character.{0,12}(trailer|PV|demo)|resonator showcase|キャラクター.{0,5}(PV|紹介)|角色.{0,6}(PV|预告|演示)|幹員.{0,6}PV|干员.{0,6}PV|오퍼레이터.{0,6}PV/i.test(title))return {kind:'character',format:'pv'};
 if(/世界观|世界觀|世界観|세계관|lore trailer|버전.{0,15}(PV|트레일러)|version.{0,20}(trailer|PV)|Ver\.?[\d.]+.{0,8}PV|版本.{0,12}PV/i.test(title))return {kind:'version',format:'pv'};
}
export function uploadEntry(channel:OfficialChannel,u:Upload,checkedAt:string,old?:Entry):Entry|undefined{
 const kind=uploadKind(u.title);if(!kind)return;
 const prev=old?.videos?.find(v=>v.youtubeId===u.youtubeId),unchanged=prev?.originalTitle===u.title;
 const title=localized('','','','');title[channel.locale]=u.title;
 const clip:VideoClip={...prev,...kind,youtubeId:u.youtubeId,title:unchanged&&prev?prev.title:title,originalTitle:u.title,titleOfficialLocales:[channel.locale],titleTranslatedLocales:unchanged?prev?.titleTranslatedLocales:[],locale:channel.locale,channel:channel.name,sourceUrl:'https://www.youtube.com/watch?v='+u.youtubeId,publishedAt:u.publishedAt||prev?.publishedAt||null,discoveredAt:prev?.discoveredAt||(u.recent?checkedAt:undefined),thumbnailUrl:u.thumbnailUrl||prev?.thumbnailUrl,verifiedAt:unchanged?prev!.verifiedAt:checkedAt,official:true,metadataVerified:true,watched:false,evidenceUrls:[channel.url]};
 return {...old,id:old?.id||`official-video-${channel.gameId}-${channel.locale}-${u.youtubeId}`,gameId:channel.gameId,region:channel.region,server:channel.region,kind:'update',contentRole:'notice',title:unchanged&&old?old.title:title,summary:old?.summary||localized('','','',''),sourceUrl:clip.sourceUrl,sourceTitle:u.title,sourceLocale:channel.locale,sourceKind:'video',officialLocales:[channel.locale],translatedLocales:unchanged?old?.translatedLocales:[],startAt:old?.startAt||null,endAt:old?.endAt||null,publishedAt:clip.publishedAt||null,verifiedAt:clip.verifiedAt,videos:[clip]};
}
export function uploadPosts(c:OfficialChannel,rows:Upload[],checkedAt:string):OfficialPost[]{return rows.map(u=>{const old=c.posts.find(p=>p.youtubeId===u.youtubeId);return {url:'https://www.youtube.com/watch?v='+u.youtubeId,originalTitle:u.title,locale:c.locale,youtubeId:u.youtubeId,thumbnailUrl:u.thumbnailUrl,publishedAt:u.publishedAt||old?.publishedAt,verifiedAt:old?.originalTitle===u.title?old.verifiedAt:checkedAt,metadataVerified:true,watched:false,sourceAccess:'metadata'};});}
