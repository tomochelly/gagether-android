import type {Entry,Locale,Localized,SourceBody} from './types';
import {sourceDocument} from './collection-review';
import {importBody,bodyRewards} from './source-bodies';
import {sameEditValue} from './inline-edit';
const blank=():Localized=>({ko:'',en:'',ja:'',zh:''});
const norm=(s:string)=>s.normalize('NFKC').replace(/\s+/g,' ').trim();
const key=(s:string)=>{let n=2166136261;for(const c of norm(s)){n^=c.codePointAt(0)!;n=Math.imul(n,16777619);}return (n>>>0).toString(16);};
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const date=(y:string,m:string,d:string)=>{const value=`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;if(new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value)throw Error('Invalid source date');return value;};
const day=(e:Entry,end=false)=>(end?e.endDate:e.startDate)||(end?e.endAt:e.startAt)?.slice(0,10)||e.pickupArchive?.[end?'endDate':'startDate'];
export async function nativeBody(locale:Locale,url:string,title:string,html:string,sourceKind:'official'|'community',at:string):Promise<SourceBody>{
 const d=sourceDocument(html,url);if(d.access!=='body')throw Error('Readable source body required');
 const images=d.images.filter(u=>!/(?:transparent1px|favicon|logo|steam_ad|store_button|dlbtn_)/i.test(u)).slice(0,20);
 const value=JSON.stringify([title,d.text,images,d.links||[]]);
 const bodyHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
 return {locale,sourceUrl:url,title,text:d.text,images,links:d.links,sourceKind,bodyHash,importedAt:at};
}
function base(gameId:string,id:string,kind:Entry['kind'],name:string,locale:Locale,url:string,sourceKind:'official'|'community',at:string,publishedAt:string|null):Entry{
 return {id,gameId,region:'global',server:'global',kind,title:{...blank(),[locale]:name},summary:blank(),startAt:null,endAt:null,publishedAt,verifiedAt:at,sourceUrl:url,sourceTitle:name,sourceLocale:locale,sourceKind,officialLocales:sourceKind==='official'?[locale]:[],translatedLocales:[]};
}
/** Reprints are supplemental evidence, never silently promoted to first-party. */
export function hololiveArticleLinks(html:string){
 const list=html.match(/<ul\b[^>]*class=["'][^"']*gdb-game-article-list[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i)?.[1];
 if(!list)throw Error('Hololive article list format changed');
 return [...new Set([...list.matchAll(/\bhref\s*=\s*(?:["']([^"']+)["']|([^\s>]+))/gi)].flatMap(m=>{try{const u=new URL(m[1]||m[2],'https://gamewith.jp');return u.hostname==='gamewith.jp'&&/^\/gamedb\/15524\/articles\/\d+\/?$/.test(u.pathname)?[u.href]:[];}catch{return [];}}))].slice(0,4);
}
/** Isolate publisher release sections. Ads and the author's profile are not game content. */
export function hololiveRelease(html:string,url:string){
 if(!/^https:\/\/gamewith\.jp\/gamedb\/15524\/articles\/\d+\/?$/.test(url))throw Error('Hololive article identity mismatch');
 const at=html.search(/\bid=["']article-body["']/i);if(at<0)throw Error('Article body missing');
 let body=html.slice(at).replace(/<(script|style)\b[\s\S]*?<\/\1>/gi,'');
 const quote=body.indexOf('以下、プレスリリース');if(quote<0)throw Error('Publisher release boundary missing');
 body=body.slice(quote);const start=body.search(/<h[23]\b[^>]*>\s*(?:『hololive Dreams』|「hololive Dreams」)/i);
 if(start<0)throw Error('Hololive publisher heading missing');body=body.slice(start);
 const stop=body.search(/<h[234]\b[^>]*>[^<]*(?:【『hololive Dreams』概要】|GameWith編集者情報)|<div\b[^>]*class=["'][^"']*gdb-install-btn/i);
 if(stop>=0)body=body.slice(0,stop);
 if(!/株式会社QualiArts/.test(body)||!/ホロドリ/.test(body)||/NTE：Neverness|gtm-ga4-title=["'](?!hololive)/.test(body))throw Error('Unrelated or unrecognized publisher body');
 // Public lazy-loading attributes contain the original, not the transparent placeholder.
 body=body.replace(/<img\b[^>]*>/gi,tag=>{const original=tag.match(/\bpreview=["'](https:\/\/img\.gamewith\.jp\/img\/original_[^"']+)["']/i)?.[1]||tag.match(/\bdata-original=["'](https:\/\/img\.gamewith\.jp\/[^"']+)["']/i)?.[1];return original?'<img src="'+esc(original)+'">':tag;});
 const title=sourceDocument(body.match(/<h2\b[^>]*>[\s\S]*?<\/h2>/i)?.[0]||'',url).text;
 const published=html.match(/"datePublished"\s*:\s*"([^"\s]+)"/)?.[1]||html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1]||null;
 return {title,html:'<article>'+body+'</article>',publishedAt:published&&Number.isFinite(Date.parse(published))?new Date(published).toISOString():null};
}
export async function hololiveEntries(html:string,url:string,at:string){
 const release=hololiveRelease(html,url),articleId=url.match(/(\d+)\/?$/)![1],out:Entry[]=[];
 const full=await nativeBody('ja',url,release.title,release.html,'community',at);
 out.push(importBody(base('holodreams','community-holodreams-'+articleId,'update',release.title,'ja',url,'community',at,release.publishedAt),full));
 const sections:RegExpMatchArray[]=[];
 for(const section of release.html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3\b|<\/article>)/gi)){
  // The publisher sometimes renders the period label as a sibling heading.
  // Keep that continuation with its named event instead of losing the dates.
  const heading=sourceDocument('<p>'+section[1]+'</p>',url).text.trim();
  if(sections.length&&/^(?:イベント|ガチャ)開催期間$/.test(heading))sections.at(-1)![2]+='<h3>'+section[1]+'</h3>'+section[2];
  else sections.push(section);
 }
 for(const section of sections){
  const heading=sourceDocument('<p>'+section[1]+'</p>',url).text;
   const kind=/ガチャ/.test(heading)?'pickup':/ゲーム内イベント|ポイントラリーイベント/.test(heading)?'event':undefined;if(!kind)continue;
  const text=sourceDocument(section[2],url).text,period=text.match(/(20\d{2})年(\d{1,2})月(\d{1,2})日[^\n～~]*[～~]\s*(20\d{2})年(\d{1,2})月(\d{1,2})日/);
  if(!period)continue;
  const startDate=date(period[1],period[2],period[3]),endDate=date(period[4],period[5],period[6]);if(endDate<startDate)throw Error('Invalid reprint period');
  const name=heading.match(/「([^」]+)」/)?.[1]||heading.replace(/^■/,'');
  const body=await nativeBody('ja',url,name,'<article>'+section[2]+'</article>','community',at);
  let e={...base('holodreams','holodreams-'+kind+'-'+articleId+'-'+key(name),kind,name,'ja',url,'community',at,release.publishedAt),startDate,endDate};
  if(kind==='pickup'){
   const members=[...section[2].matchAll(/<h4\b[^>]*>\s*[★☆]([1-6])\s*[［\[]([^］\]]+)[］\]]([^<]+)<\/h4>/gi)].map(m=>({name:{...blank(),ja:`［${m[2]}］${m[3].trim()}`},type:'new' as const,role:'featured' as const,rarity:Number(m[1])}));
   if(!members.length)continue;
   e={...e,poolType:'character',pickupGroup:'holodreams-'+articleId+'-'+key(name),pickupType:'new',pickupMembers:members} as typeof e;
  }
  out.push(importBody(e,body));
 }
 return out;
}
function jsonLd(html:string):any[]{
 return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m=>{try{const d=JSON.parse(m[1]);return Array.isArray(d)?d:d['@graph']||[d];}catch{return [];}});
}
export function limbusEventLinks(html:string){
 const page=jsonLd(html).find(d=>d['@type']==='CollectionPage'&&d.url==='https://www.pickupcal.com/games/limbus/'&&d.about?.name==='림버스 컴퍼니');
 if(!page||!Array.isArray(page.hasPart))throw Error('Limbus schedule index changed');
 return page.hasPart.filter((r:any)=>typeof r.name==='string'&&r.name.startsWith('[픽업] 림버스 컴퍼니 - ')&&/^https:\/\/www\.pickupcal\.com\/events\/\d+\/$/.test(r.url)&&!/아나운서/.test(r.name)).map((r:any)=>r.url as string).slice(-6);
}
/** Community calendars remain date-only forecasts; citations alone are not a manual official review. */
export function limbusCalendarEntry(html:string,url:string,at:string):Entry{
 if(!/^https:\/\/www\.pickupcal\.com\/events\/\d+\/$/.test(url))throw Error('Limbus detail identity mismatch');
 const p=jsonLd(html).find(d=>d['@type']==='WebPage'&&d.url===url&&d.about?.name==='림버스 컴퍼니');
 if(!p||!p.name?.startsWith('[픽업] 림버스 컴퍼니 - ')||!/^(20\d\d-\d\d-\d\d)T\d\d:\d\d\/(20\d\d-\d\d-\d\d)T\d\d:\d\d$/.test(p.temporalCoverage||''))throw Error('Limbus schedule facts missing');
 const [start,end]=p.temporalCoverage.split('/'),startDate=start.slice(0,10),endDate=end.slice(0,10);if(endDate<startDate)throw Error('Invalid community period');
 const name=p.name.slice('[픽업] 림버스 컴퍼니 - '.length),id=url.match(/events\/(\d+)/)![1];
 const citations=(Array.isArray(p.citation)?p.citation:[]).filter((u:any)=>typeof u==='string'&&/^https:\/\/steamcommunity\.com\/(?:games\/1973530|gid\/103582791473108638)\/announcements\/detail\/\d+(?:\?.*)?$/.test(u));
 const today=new Date(Date.parse(at)+9*3600000).toISOString().slice(0,10),archive=endDate<today?{status:'past' as const,startDate,endDate}:startDate>today?{status:'forecast' as const,startDate,endDate}:undefined;
 return {...base('limbus','limbus-community-'+id,'pickup',name,'ko',url,'community',at,null),poolType:'character',pickupType:'unknown',pickupGroup:'limbus-community-'+id,startDate,endDate,...(archive?{pickupArchive:archive}:{}),relatedSources:citations.map((url:string)=>({kind:'official',url,title:'Limbus Company · Steam'}))};
}
/** Native Korean event headings and their own explicit periods, including separate phases. */
export async function dnaEventEntries(body:SourceBody,publishedAt:string|null):Promise<Entry[]>{
 if(body.locale!=='ko'||body.sourceKind!=='official'||!/(?:duetnightabyss\.dna-panstudio\.com|store\.steampowered\.com\/news\/app\/3950020)/.test(body.sourceUrl))return [];
 const sections=[...body.text.matchAll(/^[ \t]*◆\s*\[([^\]\n]+)\][^\n]*◆\s*\n([\s\S]*?)(?=^[ \t]*◆|(?![\s\S]))/gm)],out:Entry[]=[];
 for(const section of sections){
  const title=section[1].trim(),text=section[2];
  const periods=[...text.matchAll(/(?:[12]차\s*)?이벤트 기간:\s*(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(업데이트 후|\d{1,2}:\d{2})\s*[~～–-]\s*(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(\d{1,2}):(\d{2})\s*\(KST\)/g)];
  for(let i=0;i<periods.length;i++){
   const m=periods[i],startDate=date(m[1],m[2],m[3]),endDate=date(m[5],m[6],m[7]);if(endDate<startDate||Number(m[8])>23||Number(m[9])>59)throw Error('Invalid DNA event period');
   const startAt=m[4]==='업데이트 후'?null:`${startDate}T${m[4].padStart(5,'0')}:00+09:00`,endAt=`${endDate}T${m[8].padStart(2,'0')}:${m[9]}:00+09:00`;
   const name=periods.length>1?title+' · '+(i+1):title;
   const heading=section[0].split('\n')[0].trim();
   const e={...base('dna','dna-event-'+key(body.sourceUrl)+'-'+key(heading)+'-'+i,'event',name,'ko',body.sourceUrl,'official',body.importedAt,publishedAt),contentRole:'activity' as const,startDate,endDate,startAt,endAt};
   // Keep only this event's conditions/rewards, never other package or character sections.
   const native=await nativeBody('ko',body.sourceUrl,name,'<article><p>'+esc(heading.replace(/^◆|◆$/g,''))+'</p>'+text.trim().split('\n').map(t=>'<p>'+esc(t)+'</p>').join('')+'</article>','official',body.importedAt);
   out.push({...importBody(e,native),summary:{...blank(),ko:text.trim()},rewards:bodyRewards(e,native)});
  }
 }
 return out;
}
/** Narrow parsed fields merge into complete originals. Foreign omissions cannot clear art, names or owner fields. */
export function applyAdditionalContent(entries:Entry[],incoming:Entry[]){
 const all=new Map(entries.map(e=>[e.id,e])),changed=new Map<string,Entry>();
 for(const fresh of incoming){
  const native=fresh.sourceLocale||'ko',name=fresh.title[native];
  const sameName=(e:Entry)=>norm(e.title[native])===norm(name)||fresh.gameId==='dna'&&native==='ko'&&e.kind==='event'&&norm(e.title.ko).startsWith(norm(name)+' · ');
  const old=all.get(fresh.id)||[...all.values()].find(e=>e.gameId===fresh.gameId&&e.region===fresh.region&&e.kind===fresh.kind&&name&&sameName(e)&&day(e)===day(fresh)&&day(e,true)===day(fresh,true));
  if(!old){all.set(fresh.id,fresh);changed.set(fresh.id,fresh);continue;}
  // A supplemental date table cannot downgrade a directly reviewed official record.
  if(old.sourceKind==='official'&&fresh.sourceKind==='community')continue;
  let next:Entry={...old,title:{...old.title,...Object.fromEntries(Object.entries(fresh.title).filter(([,v])=>v))},summary:{...fresh.summary,...Object.fromEntries(Object.entries(old.summary).filter(([,v])=>v))},sourceUrl:fresh.sourceUrl,sourceTitle:fresh.sourceTitle,sourceLocale:fresh.sourceLocale,sourceKind:fresh.sourceKind,publishedAt:fresh.publishedAt??old.publishedAt};
  for(const b of Object.values(fresh.sourceBodies||{}))next=importBody(next,b);
  if(fresh.contentRole==='activity'){next.contentRole='activity';next.rewards=fresh.rewards||[];}
  if(fresh.pickupArchive)next.pickupArchive=fresh.pickupArchive;
  if(fresh.startDate)next.startDate=fresh.startDate;if(fresh.endDate)next.endDate=fresh.endDate;
  if(fresh.startAt)next.startAt=fresh.startAt;if(fresh.endAt)next.endAt=fresh.endAt;
  // Matching the same native member preserves its other language names and all original artwork.
  if(fresh.pickupMembers?.length)next.pickupMembers=fresh.pickupMembers.map(m=>{const prior=old.pickupMembers?.find(p=>p.name[native]&&norm(p.name[native])===norm(m.name[native]));return prior?{...prior,type:m.type,role:m.role,rarity:m.rarity??prior.rarity}:m;});
  if(!sameEditValue(next,old)){next.verifiedAt=fresh.verifiedAt;all.set(old.id,next);changed.set(old.id,next);}
 }
 return [...changed.values()];
}
