import registry from '../content/leaks/wuwa-verse-source.json' with {type:'json'};
import {excludedLeakTitle,leakMarker,textOnly,type LeakVideo} from './leaks';
export const wuwaXSource=registry;
const idPattern=/^\d{16,24}$/;
export function xPostUrl(id:string){if(!idPattern.test(id))throw Error('Invalid public post ID');return registry.profileUrl+'/status/'+id;}
/** Credentialless public embed checksum, as documented in Vercel/react-tweet.
 * This is not an authentication, guest or session token. */
export function xEmbedRequest(id:string){xPostUrl(id);const u=new URL('https://cdn.syndication.twimg.com/tweet-result');u.searchParams.set('id',id);u.searchParams.set('lang','en');u.searchParams.set('token',((Number(id)/1e15)*Math.PI).toString(36).replace(/(0+|\.)/g,''));return u.href;}
export function discoverXPostIds(source:string){return [...new Set([...source.matchAll(/https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/WuWa_Verse1\/status\/(\d{16,24})(?!\d)/gi)].map(m=>m[1]))].slice(0,24);}
function mediaUrl(raw:string,video=false){const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port)throw Error('Invalid public media URL');if(video?u.hostname!=='video.twimg.com'||!/^\/(amplify_video|ext_tw_video|tweet_video)\//.test(u.pathname)||!u.pathname.endsWith('.mp4'):u.hostname!=='pbs.twimg.com'||!/^\/(media|amplify_video_thumb|ext_tw_video_thumb|tweet_video_thumb)\//.test(u.pathname))throw Error('Media outside the declared public CDN');return u;}
export function originalXPhoto(raw:string){const u=mediaUrl(raw),ext=/\.(jpg|jpeg|png|webp)$/.exec(u.pathname);if(ext){u.pathname=u.pathname.slice(0,-ext[0].length);u.searchParams.set('format',ext[1]==='jpeg'?'jpg':ext[1]);}if(!['jpg','png','webp'].includes(u.searchParams.get('format')||''))throw Error('Unknown declared original image format');u.searchParams.set('name','orig');return u.href;}
export type XLeakPost={id:string;sourceUrl:string;title:string;excerpt:string;fullText:string;locale:string;publishedAt:string;imageUrls:string[];videos:Array<{url:string;sourcePostId:string;width:number;height:number;durationMs?:number;posterUrl?:string;variants:NonNullable<LeakVideo['variants']>}>};
export function parseXPost(raw:unknown,id:string,at:string):XLeakPost{
 const d=raw as any,sourceUrl=xPostUrl(id);if(!d||d.__typename!=='Tweet'||d.id_str!==id||d.user?.id_str!==registry.accountId||d.user?.screen_name?.toLowerCase()!==registry.handle.toLowerCase())throw Error('Public embed author/post identity mismatch');
 if(typeof d.text!=='string'||d.text.length>20000)throw Error('Missing or oversize post text');const time=Date.parse(d.created_at);if(!Number.isFinite(time)||time>Date.parse(at)+86400000)throw Error('Invalid source publication time');
 const fullText=textOnly(d.text.replace(/https:\/\/t\.co\/[A-Za-z0-9]+/g,' ')),lines=d.text.replace(/https:\/\/t\.co\/[A-Za-z0-9]+/g,'').split('\n').map((s:string)=>textOnly(s)).filter(Boolean);
 const title=(lines[0]||registry.name).split(/\s+/).slice(0,12).join(' ').slice(0,300),rest=lines.slice(1).filter((s:string)=>!s.startsWith('#')).join(' '),budget=Math.max(1,23-title.split(/\s+/).length),excerpt=rest.split(/\s+/).slice(0,budget).join(' ').slice(0,1000);
 const imageUrls:string[]=[],videos:XLeakPost['videos']=[];
 for(const m of (Array.isArray(d.mediaDetails)?d.mediaDetails:[]).slice(0,12)){
  if(m.ext_media_availability?.status&&m.ext_media_availability.status!=='Available')continue;
  const width=m.original_info?.width,height=m.original_info?.height;if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>30000||height>30000)continue;
  if(m.type==='photo')imageUrls.push(originalXPhoto(m.media_url_https));
  else if(['video','animated_gif'].includes(m.type)){
   const variants:NonNullable<LeakVideo['variants']>=[];
   for(const v of m.video_info?.variants||[])if(v.content_type==='video/mp4'){
    const u=mediaUrl(v.url,true),size=/\/(\d+)x(\d+)\//.exec(u.pathname);
    variants.push({url:u.href,...Number.isInteger(v.bitrate)&&v.bitrate>=0?{bitrate:v.bitrate}:{},...size?{width:Number(size[1]),height:Number(size[2])}:{}});
   }
   variants.sort((a,b)=>(b.bitrate||0)-(a.bitrate||0));if(!variants.length)continue;
   const duration=m.video_info?.duration_millis;videos.push({url:variants[0].url,sourcePostId:id,width,height,...Number.isInteger(duration)&&duration>0&&duration<=7200000?{durationMs:duration}:{},posterUrl:originalXPhoto(m.media_url_https),variants:variants.slice(0,12)});
  }
 }
 // X's short-text language detector labels several English headings as tl/in.
 const reported=String(d.lang||'und'),locale=(registry.languageOverrides as Record<string,string>)[id]||(/^[a-zA-Z0-9-]{2,32}$/.test(reported)?reported:'und');
 return {id,sourceUrl,title,excerpt:excerpt||title,fullText,locale,publishedAt:new Date(time).toISOString(),imageUrls:[...new Set(imageUrls)].slice(0,8),videos:videos.slice(0,4)};
}
export function classifiedXLeak(post:XLeakPost,context?:string){if(excludedLeakTitle(post.title)||/giveaway|commission|fan.?art|cosplay|birthday|official announcement/i.test(post.fullText))return false;return registry.postIds.includes(post.id)||leakMarker(post.fullText)||!!context&&leakMarker(context)&&/\b(via|beta|datamin|tester|subject to change)\b/i.test(post.fullText);}
