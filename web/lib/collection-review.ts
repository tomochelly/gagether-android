import type {Entry,Locale,Region} from './types';
import {games} from './games';
import {effectiveRegion} from './presentation';
import {pickupPeriod,pickupEnd} from './pickup-history';
import {isGfl2SteamNotice,isGfl2SteamShellText} from './gfl2-steam-body';
import {nativeSteamShortArticle} from './native-steam-article';
export const pickupNotice=(title:string)=>/추출|抽出|抽取|extraction|튜닝|集音|헤드헌팅|픽업|모집|스카우트|확률|概率|確率|寻访|招募|募集|召喚|召唤|スカウト|ガチャ|ピックアップ|供給|供给|招集|headhunt|recruit|conven[ei]|banner|rate.up|gacha/i.test(title);
export function decodeSourceHtml(input:string){
 let html=input;
 for(let i=0;i<3;i++){
  if(/^\s*"[\s\S]*"\s*$/.test(html)){try{const parsed=JSON.parse(html);if(typeof parsed==='string'){html=parsed;continue;}}catch{}}
  // Escaped closing tags inside executable scripts are not escaped article prose.
  if(/<(?:html|script)\b/i.test(html))break;
  if(!/\\u003[cCeE]|\\"|\\\\u003[cCeE]/.test(html))break;
  html=html.replace(/\\u([0-9a-f]{4})/gi,(_,code)=>String.fromCharCode(parseInt(code,16))).replace(/\\"/g,'"').replace(/\\\//g,'/').replace(/\\n/g,'\n').replace(/\\r/g,'').replace(/\\t/g,' ');
  if(/\\</.test(html))html=html.replace(/\\(?=<|>)/g,'');
 }
 if(/&lt;(?:p|div|img|br|section|table|h[1-6])(?:[\s&>])/i.test(html))html=html.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
 return html;
}
/** Decode an HTML attribute once, then validate the resulting URL. */
export function sourceAttributeUrl(value:string,base:string){
 const decoded=value.replace(/&(?:#(x[0-9a-f]+|[0-9]+)|(amp|quot|apos|lt|gt));/gi,(entity,numeric,name)=>{if(name)return ({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>'} as Record<string,string>)[name.toLowerCase()];const n=parseInt(numeric.replace(/^x/i,''),/^x/i.test(numeric)?16:10);return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):entity;});
 try{const u=new URL(decoded,base);return u.protocol==='https:'&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}
}
export function sourceDocument(input:string,base:string){
 const html=decodeSourceHtml(input);
 // This publisher's articles come from the identity-checked native API. A
 // complete Steam page remains chrome even if a redesign adds main/article tags.
 if(isGfl2SteamNotice('gfl2',base)&&(/<html\b|<!doctype\s+html\b/i.test(html)||isGfl2SteamShellText('gfl2',base,html)))return {access:'js-only' as const,text:'',images:[]};
 const scripts=(html.match(/<script\b[\s\S]*?<\/script>/gi)||[]).join('').length;
 const article=html.match(/<div[^>]*class=["'][^"']*articleContent[^"']*["'][^>]*>([\s\S]*?)(?=<div[^>]*class=["'][^"']*articleBottom)/i)?.[1];
 const inner=article||html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html;
 if(inner===html&&/<html\b/i.test(html)&&scripts&&['steamcommunity.com','store.steampowered.com'].includes(new URL(base).hostname))return {access:'js-only' as const,text:'',images:[]};
 const plain=inner.replace(/<(script|style|nav|footer|header)\b[\s\S]*?<\/\1>/gi,' ').replace(/<\/(?:p|div|li|tr|h[1-6])>|<br\s*\/?>/gi,'\n').replace(/<\/(?:td|th)>/gi,' · ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim();
 if(isGfl2SteamShellText('gfl2',base,plain))return {access:'js-only' as const,text:'',images:[]};
 const images=[...new Set([...inner.matchAll(/<img\b[^>]*src=["']([^"']+)["']/gi)].flatMap(m=>{try{const u=new URL(m[1],base);return u.protocol==='https:'&&!u.username&&!u.password?[u.href]:[];}catch{return [];}}))].slice(0,40);
 if(/<html\b/i.test(html)&&scripts>1000&&plain.length<240)return {access:'js-only' as const,text:'',images:[]};
 if(plain.length<30&&!images.length&&!nativeSteamShortArticle(html,base,plain))return {access:'metadata' as const,text:plain,images:[]};
 const links=[...new Map([...inner.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].flatMap(m=>{const url=sourceAttributeUrl(m[1],base),label=m[2].replace(/<[^>]*>/g,' ').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,240);return label&&url?[[url,{label,url}] as const]:[];})).values()].slice(0,40);
 return {access:'body' as const,text:plain.slice(0,200000),images,links};
}
type CoverageRow={gameId:string;region:Region;pool:string;status:string;currentIds:string[];upcomingIds:string[];lastEndedId?:string;lastEnd?:string;reason?:string};
export function collectionCoverage(entries:Entry[],now=Date.now()){
 return games.flatMap(game=>[...new Set(game.regions.map(r=>effectiveRegion(game,r)))].flatMap<CoverageRow>(region=>{
  if(game.launch)return [{gameId:game.id,region,pool:'release',status:'not-applicable',currentIds:[],upcomingIds:[],reason:'Upcoming game; no released pickup schedule is inferred'}];
  if(game.acquisitionModel==='direct')return [{gameId:game.id,region,pool:'acquisition',status:'not-applicable',currentIds:[],upcomingIds:[],reason:'No character or weapon gacha'}];
  const all=entries.filter(e=>e.gameId===game.id&&effectiveRegion(game,e.region)===region&&e.kind==='pickup'&&!e.hidden&&e.pickupArchive?.status!=='forecast');
  const keys=game.id==='arknights'?['character','standard','kernel']:game.id==='umamusume'?['character','support']:['character'];
  return keys.map(pool=>{
   const poolText=(e:Entry)=>[e.id,e.pickupGroup,JSON.stringify(e.bannerName||{}),JSON.stringify(e.title)].join(' ');
   const list=all.filter(e=>game.id==='arknights'?(pool==='kernel'?/kernel|커널|중견|中堅|中坚/i.test(poolText(e)):pool==='standard'?e.poolType==='standard'&&!/kernel|커널|중견|中堅|中坚/i.test(poolText(e)):e.poolType!=='standard'):pool==='support'?e.poolType==='support':e.poolType!=='support');
   const current=list.filter(e=>pickupPeriod(e,now)==='current'),upcoming=list.filter(e=>pickupPeriod(e,now)==='upcoming'),last=list.filter(e=>pickupPeriod(e,now)==='past').sort((a,b)=>(pickupEnd(b)||'').localeCompare(pickupEnd(a)||''))[0];
   return {gameId:game.id,region,pool,status:current.length?'covered':upcoming.length?'announced':'needs-review',currentIds:current.map(e=>e.id),upcomingIds:upcoming.map(e=>e.id),lastEndedId:last?.id,lastEnd:last?pickupEnd(last):undefined};
  });
 }));
}
export type ReviewDocument={id:string;gameId:string;region:Region;locale:Locale;url:string;title:string;publishedAt:string|null;sourceAccess:'body'|'metadata'|'js-only'|'blocked'|'error'|'search-index';bodyHash:string;images:string[];checkedAt:string;bodyCheckedAt?:string;error?:string};
