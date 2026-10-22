import type {Entry,Locale,Region} from './types';
import {games} from './games';
import {effectiveRegion} from './presentation';
import {pickupPeriod,pickupEnd} from './pickup-history';
export const pickupNotice=(title:string)=>/헤드헌팅|픽업|모집|스카우트|확률|概率|確率|寻访|招募|募集|召喚|召唤|スカウト|ガチャ|ピックアップ|供給|供给|招集|headhunt|recruit|conven[ei]|banner|rate.up|gacha/i.test(title);
export function sourceDocument(html:string,base:string){
 const scripts=(html.match(/<script\b[\s\S]*?<\/script>/gi)||[]).join('').length;
 const inner=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html;
 const plain=inner.replace(/<(script|style|nav|footer|header)\b[\s\S]*?<\/\1>/gi,' ').replace(/<\/(?:p|div|li|h[1-6])>|<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim();
 const images=[...new Set([...inner.matchAll(/<img\b[^>]*src=["']([^"']+)["']/gi)].flatMap(m=>{try{const u=new URL(m[1],base);return u.protocol==='https:'&&!u.username&&!u.password?[u.href]:[];}catch{return [];}}))].slice(0,40);
 if(/<html\b/i.test(html)&&scripts>1000&&plain.length<240)return {access:'js-only' as const,text:'',images:[]};
 if(plain.length<30)return {access:'metadata' as const,text:plain,images:[]};
 return {access:'body' as const,text:plain.slice(0,100000),images};
}
export function collectionCoverage(entries:Entry[],now=Date.now()){
 return games.flatMap(game=>[...new Set(game.regions.map(r=>effectiveRegion(game,r)))].flatMap(region=>{
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
export type ReviewDocument={id:string;gameId:string;region:Region;locale:Locale;url:string;title:string;publishedAt:string|null;sourceAccess:'body'|'metadata'|'js-only'|'blocked'|'error'|'search-index';bodyHash:string;images:string[];checkedAt:string;error?:string};
