import type {Entry,Locale,SourceBody} from './types';
import {decodeSourceHtml,sourceDocument,type ReviewDocument} from './collection-review';
import {placeholderText,cleanDisplayText} from './content-display';
import {games} from './games';
import {contentLanguage} from './content-audience';
import excludedSourceImages from '../content/excluded-source-images.json' with {type:'json'};
import {rewardCatalog} from './reward-catalog';
export function sourceBodyFor(entry:Entry,locale:Locale){const game=games.find(g=>g.id===entry.gameId),target=game?contentLanguage(game,entry.region,locale):locale;const body=entry.sourceBodies?.[target]||entry.sourceBodies?.[entry.sourceLocale||target]||Object.values(entry.sourceBodies||{})[0];return {body,target,images:body?.locale===target?body.images:[]};}
export function bodyFromDocument(document:ReviewDocument,raw:{text?:string;images?:string[];links?:{label:string;url:string}[]}):SourceBody|null{
 if(document.sourceAccess!=='body')return null;
 const text=decodeSourceHtml(raw.text||'');const encoded=/<(?:p|div|img|br|table|section|h[1-6])\b/i.test(text),parsed=encoded?sourceDocument(text,document.url):{text,images:[],links:[]};
 const images=[...new Set([...raw.images||[],...parsed.images])].filter(url=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!excludedSourceImages.some(x=>url.split('?')[0]===x)&&!/logo|favicon|loading|footer|share[_/-]|social[_/-]|tracking|0[12][_-]공지사항[.]|공지사항-(?:상|하)/i.test(decodeURIComponent(u.pathname));}catch{return false;}}).slice(0,20);
 if(!parsed.text.trim()&&!images.length)return null;
 return {title:document.title.slice(0,400),locale:document.locale,sourceUrl:document.url,text:parsed.text.slice(0,200000),images,links:(raw.links||parsed.links||[]).slice(0,40),bodyHash:document.bodyHash,importedAt:document.checkedAt,sourceKind:'official'};
}
export function sourceExcerpt(text:string,title=''){return text.split('\n').map(s=>s.trim()).filter(s=>s&&s!==title&&!/^(?:안녕하세요[.!]?|함장님[,!]?|여행자님[,!]?|Dear .*[,!]|尊敬的.*[：:]|こんにちは[。！]?)$/i.test(s)).join(' ').slice(0,320);}
export function importBody(entry:Entry,body:SourceBody):Entry{
 const old=entry.sourceBodies?.[body.locale];if(old&&old.bodyHash===body.bodyHash&&old.text===body.text&&JSON.stringify(old.images)===JSON.stringify(body.images)&&JSON.stringify(old.links||[])===JSON.stringify(body.links||[])&&old.title===body.title)return entry;
 const title={...entry.title},summary={...entry.summary};if(placeholderText(title[body.locale]))title[body.locale]=(body.title||(body.locale===entry.sourceLocale?entry.sourceTitle:"")).slice(0,240);
 if(placeholderText(summary[body.locale]))summary[body.locale]=sourceExcerpt(body.text,title[body.locale]);
 const rewards=entry.rewards?.length?entry.rewards:bodyRewards(entry,body);
 return {...entry,title,summary,sourceBodies:{...entry.sourceBodies,[body.locale]:body},...(rewards.length?{rewards}:{} )};
}
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
/** Only explicit item/amount pairs in the source body, never the headline or a price. */
export function bodyRewards(entry:Entry,body:SourceBody){
 // Version gifts and compensation are not rewards for obtaining equipment.
 if(entry.kind==='weapon'||entry.kind==='pickup')return [];
 const rows:NonNullable<Entry['rewards']>=[];
 for(const def of rewardCatalog.filter(d=>d.gameId===entry.gameId&&d.category!=='resource')){
  const names=[...new Set([def.name[body.locale],...def.aliases].filter(s=>s&&s.length>1))].sort((a,b)=>b.length-a.length),label=names.map(escape).join('|');
  if(!label)continue;
  const re=new RegExp('(?:'+label+')[ \\t]*[×xX*＊：:]?[ \\t]*([0-9]+(?:,[0-9]{3})*)[ \\t]*(?:개|장|枚|個|个|份)?(?:$|[ \\t\\n,，.。;；·/｜|])','i'),match=body.text.match(re);
  if(!match||!Number(match[1].replace(/,/g,''))||Number(match[1].replace(/,/g,''))>1000000)continue;
  const context=body.text.slice(Math.max(0,match.index!-180),match.index!+match[0].length+100),acquisition=/판매|販売|購入|购买|售卖|pack|shop|purchase/i.test(context)?'purchase' as const:/로그인|참여|조건|ログイン|登录|参与|条件|login|complete/i.test(context)?'conditional' as const:undefined;
  rows.push({...(acquisition?{acquisition}:{}),rewardId:def.id,category:def.category,name:{...def.name},quantity:match[1],icon:def.icon,sourceUrl:body.sourceUrl,sourceKind:body.sourceKind,officialLocales:def.officialLocales||[],translatedLocales:def.translatedLocales||[]});
 }
 return rows.slice(0,12);
}
