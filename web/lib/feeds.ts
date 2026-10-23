import {blueArchiveTitle} from './bluearchive-title';
import {type Entry,type SourceCheck,type Region,type Locale} from './types';
import {readData,saveEntries,saveCheck} from './store';
import {feedEntry,type FeedNotice as Notice} from './feed-entry';
import {retryFetch} from './retry-fetch';
type Adapter={id:string;region:Region;load:()=>Promise<Notice[]>};
const locales:Locale[]=['ko','en','ja','zh'];
async function json(url:string,init?:RequestInit):Promise<any>{const r=await retryFetch(url,init);if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}
const imageFrom=(html:string)=>html?.match(/<img[^>]+src=["'](https:\/\/[^"']+)/i)?.[1];
const hoyo=[{id:'genshin',key:'a1b1f9d3315447cc',channel:395},{id:'hsr',key:'113fe6d3b4514cdd',channel:248},{id:'zzz',key:'3e9196a4b9274bd7',channel:288}];
function hoyoUrl(id:string,locale:Locale,article:string|number){const lang={ko:'ko-kr',en:'en-us',ja:'ja-jp',zh:id==='genshin'?'zh-tw':'zh-cn'}[locale];return id==='genshin'?`https://genshin.hoyoverse.com/${lang.slice(0,2)==='zh'?'zh-tw':lang.slice(0,2)}/news/detail/${article}`:id==='hsr'?`https://hsr.hoyoverse.com/${lang}/news/${article}`:`https://zenless.hoyoverse.com/${lang}/news/${article}`;}
const adapters:Adapter[]=[...hoyo.map(cfg=>({id:cfg.id,region:'global' as Region,async load(){
 const merged=new Map<string,Notice>();
 const results=await Promise.allSettled(locales.map(async locale=>{
  const key={ko:'ko-kr',en:'en-us',ja:'ja-jp',zh:cfg.id==='genshin'?'zh-tw':'zh-cn'}[locale];
  const d=await json(`https://sg-public-api-static.hoyoverse.com/content_v2_user/app/${cfg.key}/getContentList?iChanId=${cfg.channel}&iPageSize=8&iPage=1&sLangKey=${key}`);
  if(d.retcode!==0||!Array.isArray(d.data?.list))throw new Error('Source format changed');
  return {locale,rows:d.data.list};
 }));
 for(const result of results){if(result.status!=='fulfilled')continue;const {locale,rows}=result.value;for(const n of rows){const id=String(n.iInfoId);let item=merged.get(id);if(!item){let image;try{image=JSON.parse(n.sExt||'{}').banner?.[0]?.url;}catch{}item={id,titles:{},urls:{},sourceLocale:locale,date:String(n.dtStartTime||'').slice(0,10),image};merged.set(id,item);}item.titles[locale]=n.sTitle;item.urls[locale]=hoyoUrl(cfg.id,locale,id);}}
 if(!merged.size)throw new Error('All localized sources unavailable');return [...merged.values()];
 }})),
 {id:'wuwa',region:'global',async load(){
  const results=await Promise.allSettled((['ko','ja','en'] as Locale[]).map(async locale=>{const lang={en:'en',ko:'kr',ja:'jp',zh:'zh'}[locale];const d=await json(`https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/${lang}/ArticleMenu.json`);if(!Array.isArray(d))throw new Error('Source format changed');return d.sort((a:any,b:any)=>String(b.startTime).localeCompare(String(a.startTime))).slice(0,8).map((n:any):Notice=>({id:n.articleId,titles:{[locale]:n.articleTitle},urls:{[locale]:`https://wutheringwaves.kurogames.com/${lang}/main/news/detail/${n.articleId}`},sourceLocale:locale,date:String(n.startTime||'').slice(0,10),image:n.suggestCover||imageFrom(n.articleContent)}));}));
  const rows=results.flatMap(r=>r.status==='fulfilled'?r.value:[]);if(!rows.length)throw new Error('All localized sources unavailable');return rows;
 }},
 {id:'arknights',region:'global',async load(){const d=await json('https://www.arknights.global/api/resource/news/list?index=1&size=8');if(d.code!==0||!Array.isArray(d.data?.rows))throw new Error('Source format changed');return d.data.rows.map((n:any)=>({id:n.id,titles:{en:n.title},urls:{en:`https://www.arknights.global/news/${n.id}`},sourceLocale:'en',date:new Date(n.publishTime).toISOString(),image:n.bigImage||n.smallImage||imageFrom(n.content)}));}},
 {id:'bluearchive',region:'jp',async load(){const d=await json('https://api-web.bluearchive.jp/api/news/list?typeId=0&pageNum=8&pageIndex=1');if(!Array.isArray(d.data?.rows))throw new Error('Source format changed');return d.data.rows.map((n:any)=>({id:n.id,titles:{ja:blueArchiveTitle(n)},urls:{ja:`https://bluearchive.jp/news/newsJump/${n.id}`},sourceLocale:'ja',date:null,image:imageFrom(n.content)}));}},
 {id:'umamusume',region:'global',async load(){const d=await json('https://umamusume.com/api/ajax/pr_info_index?format=json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({announce_label:0,limit:8,offset:0})});if(!Array.isArray(d.information_list))throw new Error('Source format changed');return d.information_list.map((n:any)=>({id:n.announce_id,titles:{en:n.title},urls:{en:`https://umamusume.com/news/${n.announce_id}`},sourceLocale:'en',date:String(n.post_at||'').slice(0,10),image:n.image||imageFrom(n.message)}));}}
];
export const feedGameIds=adapters.map(a=>a.id);
function combineNotices(rows:Notice[]):Notice[]{
 const merged=new Map<string,Notice>();
 for(const row of rows){
  const key=String(row.id),old=merged.get(key);
  if(!old){merged.set(key,{...row,titles:{...row.titles},urls:{...row.urls}});continue;}
  const prefer=locales.indexOf(row.sourceLocale)<locales.indexOf(old.sourceLocale);
  merged.set(key,{...(prefer?row:old),titles:{...old.titles,...row.titles},urls:{...old.urls,...row.urls}});
 }
 return [...merged.values()];
}
export async function refreshFeeds():Promise<SourceCheck[]>{
 const previous=new Map((await readData({automatic:true,collection:true})).entries.filter(e=>e.id.startsWith('feed-')).map(e=>[e.id,e]));
 return Promise.all(adapters.map(async cfg=>{
  const checkedAt=new Date().toISOString();
  try{
   const notices=combineNotices(await cfg.load());
   const entries:Entry[]=notices.map(n=>feedEntry(cfg.id,cfg.region,n,checkedAt,previous.get(`feed-${cfg.id}-${n.id}`)));
   await saveEntries(entries.filter(e=>JSON.stringify(e)!==JSON.stringify(previous.get(e.id))));const check:SourceCheck={gameId:cfg.id,checkedAt,status:'ok',count:entries.length};await saveCheck(check);return check;
  }catch(error){const check:SourceCheck={gameId:cfg.id,checkedAt,status:'error',count:0,error:error instanceof Error?error.message:'Source unavailable'};await saveCheck(check);return check;}
 }));
}
