import type {Locale} from './types';
import type {FastNotice} from './fast-notices';
import type {RegionalNotice,RegionalSource} from './regional-notices';
const escape=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const https=(s:string)=>{try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}};
export const steamGames={limbus:{app:1973530,clan:43587230,clanSteam:'103582791473108638'},dna:{app:3950020,clan:45759289,clanSteam:'103582791475280697'},holodreams:{app:4282500,clan:46191865,clanSteam:'103582791475713273'}};
const steamLocales={ko:{key:'koreana',index:4},en:{key:'english',index:0},ja:{key:'japanese',index:10},zh:{key:'schinese',index:6}};
const steamLanguage=(gameId:string,locale:Locale)=>gameId==='dna'&&locale==='zh'?{key:'tchinese',index:7}:steamLocales[locale];
/** Inert official BBCode; raw HTML and embedded scripts never execute. */
export function steamBodyHtml(body:string){
 let value=escape(body.replace(/\{STEAM_CLAN_IMAGE\}/g,'https://clan.fastly.steamstatic.com/images'));
 value=value.replace(/\[img\]([\s\S]*?)\[\/img\]/gi,(_,url)=>https(url)?'<img src="'+url+'">':'')
  .replace(/\[url=(https:[^\]\s]+)\]([\s\S]*?)\[\/url\]/gi,(_,url,label)=>https(url)?'<a href="'+url+'">'+label+'</a>':label)
  .replace(/\[previewyoutube=([\w-]{11});[^\]]*\][\s\S]*?\[\/previewyoutube\]/gi,(_,id)=>'<a href="https://www.youtube.com/watch?v='+id+'">YouTube</a>')
  .replace(/\[(?:p|h[1-6]|list|olist|table|tr|td)(?:=[^\]]*)?\]/gi,'<p>').replace(/\[\/(?:p|h[1-6]|list|olist|table|tr|td)\]/gi,'</p>')
  .replace(/\[\*\]/g,'<br>• ').replace(/\[\/?(?:b|i|u|strike|hr|spoiler|noparse)\]/gi,'').replace(/\r?\n/g,'<br>');
 return '<article>'+value+'</article>';
}
const iso=(value:unknown)=>Number(value)>0?new Date(Number(value)*1000).toISOString():null;
export function parseSteamEvents(value:any,gameId:keyof typeof steamGames,locale:Locale):RegionalNotice[]{
 const config=steamGames[gameId];if(value?.success!==1||!Array.isArray(value.events))throw Error('Official Steam format changed');
 return value.events.filter((e:any)=>e.appid===config.app&&String(e.clan_steamid)===config.clanSteam&&e.published===1&&!e.hidden&&String(e.announcement_body?.clanid)===String(config.clan)&&e.announcement_body.language===steamLanguage(gameId,locale).index&&/^\d+$/.test(String(e.gid))&&typeof e.announcement_body.body==='string').map((e:any)=>({gameId,region:'global',locale,id:String(e.gid),title:String(e.announcement_body.headline||e.event_name),url:'https://store.steampowered.com/news/app/'+config.app+'/view/'+e.gid+'?l='+steamLanguage(gameId,locale).key,publishedAt:iso(e.announcement_body.posttime),bodyHtml:steamBodyHtml(e.announcement_body.body)}));
}
const dnaCategories={ko:859,en:860,ja:858,zh:861},dnaPaths={ko:'ko',en:'en',ja:'ja',zh:'zh-tw'},dnaOrigin='https://duetnightabyss.dna-panstudio.com';
export function parseDnaNotices(value:any,locale:Locale):RegionalNotice[]{
 if(value?.code!==0||!Array.isArray(value.data?.data))throw Error('Official DNA format changed');
 return value.data.data.filter((n:any)=>Number(n.website_id)===76&&/^\d+$/.test(String(n.id))&&typeof n.title==='string'&&typeof(n.body_ggtd||n.body)==='string').sort((a:any,b:any)=>Number(b.online_at||b.created_at)-Number(a.online_at||a.created_at)).map((n:any)=>({gameId:'dna',region:'global',locale,id:String(n.id),title:n.title,url:dnaOrigin+'/'+dnaPaths[locale]+'/news/detail?id='+n.id+'&type='+n.category_id,publishedAt:iso(n.online_at||n.created_at),bodyHtml:n.body_ggtd||n.body}));
}
async function readJson(fetcher:typeof fetch,url:string,fields?:Record<string,string>){
 const body=fields?new FormData():undefined;if(body)for(const [k,v]of Object.entries(fields!))body.set(k,v);
 const r=await fetcher(url,{method:body?'POST':'GET',body,redirect:'manual',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);try{return await r.json();}catch{throw Error('HTTP 200 non-JSON/JavaScript shell');}
}
export const additionalOfficialSources:RegionalSource[]=[];
for(const [gameId,c]of Object.entries(steamGames))for(const locale of (gameId==='limbus'?['ko','en','ja']:['ko','en','ja','zh']) as Locale[]){
 const url='https://store.steampowered.com/events/ajaxgetpartnereventspageable/?clan_accountid='+c.clan+'&appid='+c.app+'&offset=0&count=12&l='+steamLanguage(gameId,locale).key;
 additionalOfficialSources.push({gameId,region:'global',locale,key:gameId+'/global/'+locale+'/steam',url,load:async fetcher=>parseSteamEvents(await readJson(fetcher,url),gameId as keyof typeof steamGames,locale)});
}
for(const locale of ['ko','en','ja','zh']as const){
 const url=dnaOrigin+'/api/common/get-list.html';additionalOfficialSources.push({gameId:'dna',region:'global',locale,key:'dna/global/'+locale+'/official',url,staleAfterDays:60,load:async fetcher=>parseDnaNotices(await readJson(fetcher,url,{id:String(dnaCategories[locale]),pageSize:'30',page:'1'}),locale).slice(0,12)});
}
/** Fetch only a known exact source identity; preserve native language and null gameplay clocks. */
export async function additionalNoticeBody(n:FastNotice,fetcher:typeof fetch){
 if(n.gameId==='dna'&&n.url.startsWith(dnaOrigin+'/')){
  const u=new URL(n.url);if(u.pathname!=='/'+dnaPaths[n.locale]+'/news/detail'||u.searchParams.get('id')!==n.id)throw Error('DNA notice identity mismatch');
  const d:any=await readJson(fetcher,dnaOrigin+'/api/common/get-content-detail.html',{id:n.id}),r=d?.data;
  if(d.code!==0||String(r?.id)!==n.id||Number(r.website_id)!==76||typeof(r.body_ggtd||r.body)!=='string')throw Error('DNA detail format or identity changed');return r.body_ggtd||r.body;
 }
 if(n.gameId in steamGames){
  const s=additionalOfficialSources.find(s=>s.gameId===n.gameId&&s.locale===n.locale);if(!s)return undefined;
  return (await s.load(fetcher)).find(row=>row.id===n.id&&row.url===n.url)?.bodyHtml;
 }
 return undefined;
}
