import type {Entry,Locale,SourceBody} from './types';
import {importBody} from './source-bodies';
import {reviewedSignatureRefs} from './weapon-links';
const blank=()=>({ko:'',en:'',ja:'',zh:''});
const normalized=(s:string)=>s.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
const names=(e:Entry)=>[e.title,...(e.pickupMembers||[]).filter(m=>m.role==='featured').map(m=>m.name)];
const hasName=(e:Entry,name:string)=>names(e).some(n=>Object.values(n).some(v=>v&&normalized(v)===normalized(name)));
const sameEntity=(a:Entry,b:Entry)=>names(a).some(n=>Object.values(n).some(v=>v&&hasName(b,v)));
const day=(e:Entry,end=false)=>(end?e.endAt:e.startAt)?.slice(0,10)||(end?e.endDate:e.startDate)||e.pickupArchive?.[end?'endDate':'startDate'];
export interface WeaponAnnouncement {name:string;rateUps:string[];startDate:string;endDate:string;startAt:string|null;endAt:string|null;startClock:string;endClock:string}
/** Deliberately parse the five-star weapon rate-up sentence, never arbitrary mentions or four-stars. */
export function parseWuwaWeapons(body:SourceBody):WeaponAnnouncement[]{
 if(!/무기.*튜닝|Weapon Convene|武器集音/i.test(body.title||''))return [];
 const re=body.locale==='ko'?/5성\s*무기\s*[「『“"]([^」』”"\n]+)[」』”"]/g:body.locale==='ja'?/星5武器\s*[「『“"]([^」』”"\n]+)[」』”"]/g:body.locale==='en'?/5-Star Weapon:\s*([^,\n]+),\s*4-Star Weapons:/gi:null;
 if(!re)return [];
 const found:WeaponAnnouncement[]=[];
 for(const m of body.text.matchAll(re)){
  const text=body.text.slice(m.index!,m.index!+1200),next=text.search(/\n\s*(?:\[[^\n]+\]\s*(?:캐릭터|무기) 이벤트 튜닝|(?:共鳴者|武器)集音)/),section=next>0?text.slice(0,next):text;
  const dates=[...section.matchAll(/(20\d{2})(?:년\s*|年|[-/])(\d{1,2})(?:월\s*|月|[-/])(\d{1,2})(?:일\s*|日\s*|\s+)(\d{1,2}):(\d{2})/g)].slice(0,2);
  if(dates.length!==2)continue;
  const date=(d:RegExpMatchArray)=>`${d[1]}-${d[2].padStart(2,'0')}-${d[3].padStart(2,'0')}`,clock=(d:RegExpMatchArray)=>`${d[4].padStart(2,'0')}:${d[5]}`;
  const startDate=date(dates[0]),endDate=date(dates[1]),startClock=clock(dates[0]),endClock=clock(dates[1]);
  if(dates.some(d=>Number(d[2])>12||Number(d[3])>31||Number(d[4])>23||Number(d[5])>59)||endDate<startDate)throw Error('Invalid weapon announcement period');
  const offset=/日本標準時|日本标准时间|JST|KST|한국\s*표준시|UTC\s*\+\s*0?9/i.test(section)?'+09:00':null;
  const startAt=offset?`${startDate}T${startClock}:00${offset}`:null,endAt=offset?`${endDate}T${endClock}:00${offset}`:null;
  if(startAt&&endAt&&Date.parse(startAt)>=Date.parse(endAt))throw Error('Invalid weapon announcement window');
  const line=section.split('\n').slice(0,3).join(' '),four=body.locale==='en'?line.split(/4-Star Weapons:/i)[1]||'':line.split(/4성\s*무기|星4武器/)[1]||'';
  const rateUps=body.locale==='en'?four.split(/receive|will|have/i)[0].split(/,|\band\b/).map(s=>s.trim()).filter(Boolean):[...four.matchAll(/[「『“"]([^」』”"\n]+)[」』”"]/g)].map(m=>m[1]);
  if(!m[1].trim()||/^\d+$/.test(m[1].trim()))continue;
  const row={name:m[1].trim(),rateUps,startDate,endDate,startAt,endAt,startClock,endClock};
  const duplicate=found.find(r=>normalized(r.name)===normalized(row.name));
  if(duplicate&&JSON.stringify(duplicate)!==JSON.stringify(row))throw Error('Conflicting weapon announcement periods');
  if(!duplicate)found.push(row);
 }
 return found;
}
const stableName=(s:string)=>{let hash=2166136261;for(const c of s){hash^=c.codePointAt(0)!;hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16);};
export function applyWuwaWeapons(entries:Entry[],body:SourceBody,publishedAt:string|null,now=Date.now()){
 const all=new Map(entries.map(e=>[e.id,e])),changed=new Map<string,Entry>(),issues:string[]=[];
 for(const row of parseWuwaWeapons(body)){
  // Current collection does not manufacture historical weapon archive records.
  if(row.endDate<new Date(now-7*86400000).toISOString().slice(0,10))continue;
  const same=entries.filter(e=>e.gameId==='wuwa'&&e.region==='global'&&e.kind==='weapon'&&hasName(e,row.name));
  const candidates=same.filter(e=>!e.pickupArchive&&day(e)===row.startDate);
  if(candidates.length>1){issues.push('Duplicate weapon rotation: '+row.name);continue;}
  let old=candidates[0];
  // Unknown foreign names need an explicit mapping; they must not create parallel global rotations.
  const known=same[0];
  if(!old&&!known&&body.locale!=='ko'){issues.push('Weapon name mapping missing: '+row.name);continue;}
  if(!old){const title=known?{...known.title}:{...blank(),[body.locale]:row.name};old={id:`wuwa-global-weapon-${row.startDate.replace(/-/g,'')}-${stableName(normalized(known?.title.en||row.name))}`,gameId:'wuwa',region:'global',kind:'weapon',server:'global',title,summary:blank(),startAt:null,endAt:null,publishedAt,verifiedAt:body.importedAt,sourceUrl:body.sourceUrl,sourceTitle:body.title||row.name,sourceLocale:body.locale,sourceKind:'official',poolType:'weapon',pickupType:known?'rerun':'unknown'};}
  if(!candidates.length&&all.has(old.id)){issues.push('Weapon ID collision: '+row.name);continue;}
  if(row.startAt&&old.startAt&&Date.parse(row.startAt)!==Date.parse(old.startAt)||row.endAt&&old.endAt&&Date.parse(row.endAt)!==Date.parse(old.endAt)||day(old,true)&&day(old,true)!==row.endDate){issues.push('Weapon schedule conflict: '+row.name);continue;}
  // A date-only native notice can retain a previously sourced exact clock for the SAME weapon/rotation.
  const timed=same.find(e=>e.sourceKind==='official'&&day(e)===row.startDate&&day(e,true)===row.endDate&&e.startAt?.slice(11,16)===row.startClock&&e.endAt?.slice(11,16)===row.endClock);
  let next=importBody(old,body);
  next={...next,pickupMembers:next.pickupMembers?.map(m=>({...m}))};
  const primary=body.locale==='ko'||old.sourceKind!=='official',sourceUrls=new Set((next.relatedSources||[]).map(s=>s.url));
  next={...next,startDate:row.startDate,endDate:row.endDate,startAt:row.startAt||old.startAt||timed?.startAt||null,endAt:row.endAt||old.endAt||timed?.endAt||null,poolType:'weapon',rarity:5,localizationSources:{...next.localizationSources,[body.locale]:body.sourceUrl},relatedSources:sourceUrls.has(body.sourceUrl)?next.relatedSources:[...(next.relatedSources||[]),{kind:'official' as const,url:body.sourceUrl,title:body.title||row.name,publisher:'KURO GAMES'}].slice(-20),...(primary?{sourceUrl:body.sourceUrl,sourceTitle:body.title||row.name,sourceLocale:body.locale,sourceKind:'official' as const,publishedAt}:{} )};
  if(!next.pickupMembers?.some(m=>m.role==='featured'&&Object.values(m.name).some(n=>normalized(n)===normalized(row.name))))next.pickupMembers=[...(next.pickupMembers||[]),{name:{...next.title},type:next.pickupType==='mixed'?'unknown':next.pickupType||'unknown',role:'featured',rarity:5}];
  for(const name of row.rateUps)if(!next.pickupMembers.some(m=>Object.values(m.name).some(n=>normalized(n)===normalized(name))))next.pickupMembers.push({name:{...blank(),[body.locale]:name},type:'unknown',role:'rate-up',rarity:4});
  if(JSON.stringify(next)!==JSON.stringify(old)){next.verifiedAt=body.importedAt;all.set(next.id,next);changed.set(next.id,next);}
  // Reuse explicit sourced entity/weapon associations. Matching dates alone never establishes one.
  const owners=entries.filter(c=>c.gameId==='wuwa'&&c.region==='global'&&c.kind==='pickup'&&reviewedSignatureRefs(c).some(ref=>same.some(w=>w.id===ref.entryId)));
  for(const character of entries.filter(c=>c.gameId==='wuwa'&&c.region==='global'&&c.kind==='pickup'&&c.poolType!=='support'&&c.poolType!=='weapon'&&day(c)===row.startDate&&day(c,true)===row.endDate&&owners.some(owner=>sameEntity(c,owner)))){
   const current=all.get(character.id)!,refs=current.signatureWeapons||[],oldRef=refs.find(r=>r.entryId===next.id);
   if(oldRef)continue;
   const proven=owners.flatMap(c=>c.signatureWeapons||[]).find(ref=>same.some(w=>w.id===ref.entryId));
   const link={entryId:next.id,sourceUrl:proven?.sourceUrl||body.sourceUrl,sourceKind:proven?.sourceKind||'official' as const,verifiedAt:proven?.verifiedAt||body.importedAt};
   const updated={...current,signatureWeapons:[...refs,link]};all.set(updated.id,updated);changed.set(updated.id,updated);
  }
 }
 return {entries:[...changed.values()],issues};
}
