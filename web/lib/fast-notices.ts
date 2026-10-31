import {localCampaignMarket} from './local-campaign-audience';
import type {Entry,Locale,Region} from './types';
import {localized,safeSource} from './types';
import {expandedOfficialSources} from './expanded-notices';
import {additionalOfficialSources} from './additional-game-notices';
export type FastNotice={gameId:string;region:Region;id:string;title:string;url:string;locale:Locale;publishedAt:string|null};
export type FastSource={key:string;gameId:string;url:string;coverage?:'limited-homepage';load:(fetcher:typeof fetch)=>Promise<FastNotice[]>};
// API titles are plain text: angle brackets can enclose an actual work title.
export const noticeText=(s:string)=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(entity,n)=>{const point=Number.parseInt(n.replace(/^x/i,''),/^x/i.test(n)?16:10);return point>=0&&point<=0x10ffff?String.fromCodePoint(point):entity;}).replace(/\s+/g,' ').trim();
export const textOnly=(s:string)=>noticeText(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' '));
async function body(fetcher:typeof fetch,url:string,init?:RequestInit){const r=await fetcher(url,{...init,signal:AbortSignal.timeout(15000),redirect:'manual'});if(!r.ok)throw Error('HTTP '+r.status);const s=await r.text();if(!s.trim())throw Error('HTTP 200 empty response');return s;}
async function json(f:typeof fetch,u:string,init?:RequestInit){const s=await body(f,u,init);try{return JSON.parse(s);}catch{throw Error('HTTP 200 non-JSON/JavaScript shell');}}
const iso=(n:number)=>Number.isFinite(n)&&n>0?new Date(n).toISOString():null;
export function parseEndfield(s:string):FastNotice[]{
 const out:FastNotice[]=[];
 for(const m of s.matchAll(/self\.__next_f\.push\((\[1,"(?:[^"\\]|\\.)*"\])\)/g)){
  let payload;try{payload=JSON.parse(m[1])[1];}catch{continue;}
  for(const n of payload.matchAll(/\{"cid":"([^"\\]+)","tab":"[^"\\]*","sticky":(?:true|false),"title":("(?:[^"\\]|\\.)*"),"author":"[^"\\]*","displayTime":(\d+)/g))out.push({gameId:'endfield',region:'global',id:n[1],title:JSON.parse(n[2]),locale:'ko',publishedAt:iso(Number(n[3])*1000),url:'https://endfield.gryphline.com/ko-kr/news/'+n[1]});
 }return out;
}
export function parseNte(s:string):FastNotice[]{return [...s.matchAll(/<a\b[^>]*href="(\/kr\/article\/news\/[^" ]+\/(\d+)\.html)"[^>]*>([\s\S]*?)<\/a>/g)].flatMap(m=>{const title=m[3].match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1];if(!title)return [];return [{gameId:'nte',region:'global' as Region,id:m[2],title:textOnly(title),url:'https://nte.perfectworld.com'+m[1],locale:'ko' as Locale,publishedAt:m[3].match(/\d{4}-\d\d-\d\d/)?.[0]||null}];});}
export function parseSteam(s:string,region:Region,locale:Locale):FastNotice[]{return [...s.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap(m=>{const field=(tag:string)=>noticeText(m[1].match(new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)</'+tag+'>'))?.[1]||'');const url=field('link'),id=url.match(/announcements\/detail\/(\d+)/)?.[1];if(!id)return [];return [{gameId:'gfl2',region,locale,id,title:field('title'),url,publishedAt:iso(Date.parse(field('pubDate')))}];});}
export function parseReverseHomepage(s:string):FastNotice[]{
 const block=s.match(/class="news-right-con-list-left"[^>]*>\s*<a\b[^>]*>([\s\S]*?)<\/a>/i);
 if(!block)return [];
 return [{gameId:'reverse1999',region:'global',locale:'ko',id:'homepage-current',title:textOnly(block[1]),url:'https://reverse1999.haoplay.com/',publishedAt:null}];
}
const sources:FastSource[]=[];
function add(gameId:string,key:string,url:string,parse:(s:string)=>FastNotice[]){sources.push({gameId,key,url,load:async f=>parse(await body(f,url))});}
add('endfield','endfield/kr','https://endfield.gryphline.com/ko-kr/news',parseEndfield);
add('nte','nte/kr','https://nte.perfectworld.com/kr/article/news/index.html',parseNte);
add('gfl2','gfl2/kr','https://steamcommunity.com/games/3308670/rss/?l=koreana',s=>parseSteam(s,'kr','ko'));
sources.push({gameId:'reverse1999',key:'reverse1999/kr/homepage-limited',url:'https://reverse1999.haoplay.com/',coverage:'limited-homepage',load:async f=>parseReverseHomepage(await body(f,'https://reverse1999.haoplay.com/'))});
for(const board of [1018,1076]){
 const url=`https://forum.nexon.com/api/v1/board/${board}/threads?pageNo=1&paginationType=PAGING&pageSize=10&blockSize=5&hideType=WEB`;
 sources.push({gameId:'bluearchive',key:'bluearchive/kr/'+board,url,load:async f=>(await json(f,url)).threads.filter((n:any)=>n.user?.isAdmin&&!n.isDelete).map((n:any)=>({gameId:'bluearchive',region:'kr',locale:'ko',id:n.threadId,title:n.title,url:`https://forum.nexon.com/bluearchive/board_view?board=${board}&thread=${n.threadId}`,publishedAt:iso(Number(n.createDate)*1000)}))});
}
for(const [gameId,profile] of [['umamusume','_DzxjIb'],['nte','_uSxfcG']]){
 const url=`https://pf.kakao.com/rocket-web/web/profiles/${profile}/posts?includePinnedPost=true`;
 sources.push({gameId,key:gameId+'/kr/kakao',url,load:async f=>(await json(f,url)).items.filter((n:any)=>!n.is_private&&n.status==='published').slice(0,10).map((n:any)=>({gameId,region:gameId==='umamusume'?'kr':'global',locale:'ko',id:String(n.id),title:n.title||noticeText(n.contents?.find((c:any)=>c.t==='text')?.v||'').slice(0,180),url:`https://pf.kakao.com/${profile}/${n.id}`,publishedAt:iso(Number(n.published_at))}))});
}
for(const label of [496,892]){
 const url='https://na-community.playerinfinite.com/api/gpts.information_feeds_svr.InformationFeedsSvr/GetContentByLabel';
 sources.push({gameId:'nikke',key:'nikke/kr/'+label,url,load:async f=>{const d=await json(f,url,{method:'POST',headers:{'Content-Type':'application/json','X-GameId':'16','X-AreaId':'na','X-Source':'pc_web','X-Language':'ko'},body:JSON.stringify({primary_label_id:309,secondary_label_id:label,offset:0,get_num:10,disable_use_default_language:true})});if(d.code!==0)throw Error('Official API error '+d.code);return d.data.info_content.map((n:any)=>({gameId:'nikke',region:'global',locale:'ko',id:n.content_id,title:n.title,url:`https://nikke-kr.com/newsdetail.html?content_id=${n.content_id}`,publishedAt:iso(Number(n.pub_timestamp)*1000)}));}});
}
// Failure is explicit when this API is empty; the hourly reviewer also checks the Korean official X channel.
const ak='https://www.arknights.kr/api/resource/news/list?index=1&size=8';
sources.push({gameId:'arknights',key:'arknights/kr',url:ak,load:async f=>(await json(f,ak)).data.rows.map((n:any)=>({gameId:'arknights',region:'kr',locale:'ko',id:String(n.id),title:n.title,url:`https://www.arknights.kr/news/${n.id}`,publishedAt:iso(Number(n.publishTime))}))});
export const koreanFastSources=[...sources,...expandedOfficialSources,...additionalOfficialSources.filter(s=>s.locale==='ko')];
export function noticeEntry(n:FastNotice,checkedAt:string):Entry{
 if(!n.title||!safeSource(n.url,n.gameId))throw Error('Unrecognized official notice');
 const title=localized('','','','');title[n.locale]=noticeText(n.title).slice(0,240);
 // Steam uses the same event ID for each native language. They are independent
 // originals, so sharing a row ID would silently replace Korean with Japanese.
 const nativeSuffix=['limbus','dna','holodreams'].includes(n.gameId)?'-'+n.locale:'';
 const entry:Entry={id:`quick-${n.gameId}-${n.region}-${n.id}${nativeSuffix}`,gameId:n.gameId,region:n.region,server:n.region,kind:'update',title,summary:localized('','','',''),sourceUrl:n.url,sourceTitle:title[n.locale],sourceLocale:n.locale,sourceKind:'official',officialLocales:[n.locale],translatedLocales:[],localizationSources:{[n.locale]:n.url},publishedAt:n.publishedAt,verifiedAt:checkedAt,startAt:null,endAt:null,imageVerified:false};
 const market=localCampaignMarket(entry);return market?{...entry,marketRegion:market}:entry;
}

/** Native metadata changes publish immediately without clearing saved gameplay details. */
export function noticeMetadataChange(old:Entry|undefined,n:FastNotice,checkedAt:string):Entry|undefined{
 if(!old||old.gameId!==n.gameId||old.sourceUrl!==n.url)return undefined;
 const sourceTitle=noticeText(n.title).slice(0,800),publishedAt=n.publishedAt||old.publishedAt;
 if(old.sourceTitle===sourceTitle&&old.publishedAt===publishedAt&&old.sourceLocale===n.locale)return undefined;
 return {...old,sourceTitle,sourceLocale:n.locale,publishedAt,verifiedAt:checkedAt,title:/^(quick-|feed-)/.test(old.id)?{...old.title,[n.locale]:sourceTitle.slice(0,240)}:old.title};
}

/** Lean collection rows are read-only projections, never replacement records. */
export function completeNoticeMetadata(previous:Entry,change:Entry):Entry{return {...previous,sourceTitle:change.sourceTitle,sourceLocale:change.sourceLocale,title:change.title,publishedAt:change.publishedAt??previous.publishedAt,verifiedAt:change.verifiedAt};}
