'use client';
import {useDisplayZone} from './display-time';
import {useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,History,CalendarClock,ChevronDown} from 'lucide-react';
import type {Entry,Locale,Region} from '@/lib/types';
import {availableInLocale,entryTitle,localizedName,inSchedule,regionLabel,featuredMembers} from '@/lib/presentation';
import {historyText,isPickup,pickupEnd,pickupStart,pickupPeriod,type PickupPeriod} from '@/lib/pickup-history';
import {useCatalog} from './catalog-context';
import {historyGameFilter} from '@/lib/history-game-filter';
import {ownerUi} from '@/lib/owner-ui';
import SourceFooter from './source-footer';
import UpcomingPickups from './upcoming-pickups';
import {pickupStartLabel,pickupEstimate,estimateText} from '@/lib/pickup-estimates';
const noFavorites:string[]=[];
const dateLabel=(value?:string)=>value?.replaceAll('-','.')||'—';
export default function PickupHistory({entries,locale,region,gameId,search='',myOnly=false,favorites=noFavorites,onOpen}:{entries:Entry[];locale:Locale;region:Region;gameId?:string;search?:string;myOnly?:boolean;favorites?:string[];onOpen:(entry:Entry)=>void}){
 const zone=useDisplayZone();const {games,byId,t}=useCatalog();const l=historyText[locale];const [chosenGame,setChosenGame]=useState('all');const [period,setPeriod]=useState<PickupPeriod>('past');const [pool,setPool]=useState('all');const [month,setMonth]=useState('all');const [limit,setLimit]=useState(30);const [now,setNow]=useState(Date.now());
 const {availableGames,selectedGameId}=historyGameFilter(games,chosenGame,myOnly,favorites,gameId);
 const favoriteScope=myOnly&&!gameId;const allGamesLabel=favoriteScope?ownerUi[locale].myGames:l.allGames;
 const selectedGame=selectedGameId==='all'?undefined:byId[selectedGameId];
 useEffect(()=>{if(!gameId&&chosenGame!==selectedGameId)setChosenGame(selectedGameId);},[gameId,chosenGame,selectedGameId]);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{setMonth('all');setLimit(30);},[period,pool,gameId,selectedGameId,region,search,myOnly,favorites]);
 const scope=useMemo(()=>entries.filter(e=>!e.hidden&&isPickup(e)&&byId[e.gameId]&&inSchedule(e,byId[e.gameId],region)&&availableInLocale(e,locale)&&(!favoriteScope||favorites.includes(e.gameId))&&(selectedGameId==='all'||e.gameId===selectedGameId)&&(!search||[...Object.values(e.title),...(e.pickupMembers||[]).flatMap(m=>Object.values(m.name))].join(' ').toLowerCase().includes(search.toLowerCase()))),[entries,region,locale,selectedGameId,favoriteScope,favorites,search,byId]);
 const counts=Object.fromEntries((['current','upcoming','past'] as PickupPeriod[]).map(p=>[p,scope.filter(e=>pickupPeriod(e,now)===p).length]));
 const candidates=scope.filter(e=>pickupPeriod(e,now)===period&&(pool==='all'||(e.poolType||(e.kind==='weapon'?'weapon':'character'))===pool));
 const months=[...new Set(candidates.map(e=>(pickupStart(e,zone)||pickupEnd(e,zone))?.slice(0,7)).filter((v):v is string=>!!v))].sort().reverse();
 const filtered=candidates.filter(e=>month==='all'||(pickupStart(e,zone)||pickupEnd(e,zone))?.startsWith(month)).sort((a,b)=>{const da=pickupStart(a,zone)||pickupEnd(a,zone)||'9999',db=pickupStart(b,zone)||pickupEnd(b,zone)||'9999';return period==='past'?db.localeCompare(da):da.localeCompare(db);});
 const historyDates=scope.filter(e=>pickupPeriod(e,now)==='past').flatMap(e=>[pickupStart(e,zone),pickupEnd(e,zone)]).filter((v):v is string=>!!v).sort();
 const labelPool=(e:Entry)=>e.poolType==='support'?t.supportPool:e.poolType==='standard'?t.standardPool:e.kind==='weapon'?t.weaponPool:t.characterPool;
 return <section className="pickup-history" aria-label={l.title}>
  <header className="history-heading"><div><History size={20}/><h2>{l.title}</h2></div><p>{selectedGame?`${selectedGame.name[locale]} · ${regionLabel(selectedGame,region,locale,t)}`:allGamesLabel}</p></header>
  <div className="history-periods" role="tablist" aria-label={l.title}>{(['current','upcoming','past'] as PickupPeriod[]).map(p=><button key={p} className={p===period?'active':''} role="tab" aria-selected={p===period} onClick={()=>setPeriod(p)}>{l[p]}<b>{counts[p]}</b></button>)}</div>
  <div className="history-filters">{!gameId&&<select aria-label={l.allGames} value={selectedGameId} onChange={e=>setChosenGame(e.target.value)}><option value="all">{allGamesLabel}</option>{availableGames.map(g=><option key={g.id} value={g.id}>{g.name[locale]}</option>)}</select>}<select aria-label={l.allPools} value={pool} onChange={e=>setPool(e.target.value)}><option value="all">{l.allPools}</option><option value="character">{t.characterPool}</option><option value="support">{t.supportPool}</option><option value="standard">{t.standardPool}</option></select><select aria-label={l.allMonths} value={month} onChange={e=>{setMonth(e.target.value);setLimit(30);}}><option value="all">{l.allMonths}</option>{months.map(m=><option key={m} value={m}>{m.replace('-','.')}</option>)}</select><span>{filtered.length} {l.records}</span></div>
  {period==='upcoming'?<UpcomingPickups key={selectedGameId+pool+month+region+search} entries={filtered} locale={locale} now={now} onOpen={onOpen} heading={false}/>:<div className="history-rows">{filtered.slice(0,limit).map(e=>{const start=pickupStart(e,zone),end=pickupEnd(e,zone),members=featuredMembers(e)||[],candidateCount=(e.pickupMembers||[]).filter(m=>m.role==='candidate').length,forecast=e.pickupArchive?.status==='forecast';return <button key={e.id} className={'history-row'+(period==='past'?' past':'')+(forecast?' forecast':'')} onClick={()=>onOpen(e)}>
   <span className="history-dates"><time>{dateLabel(start)}</time><span>—</span><time>{dateLabel(end)}</time><small>{!start&&!end?l.unknownDate:!e.startAt&&!e.endAt?l.dateOnly:zone}</small></span>
   <span className="history-description"><span className="history-meta">{!gameId&&<span>{byId[e.gameId].name[locale]}</span>}<span>{regionLabel(byId[e.gameId],e.region,locale,t)}</span><span>{labelPool(e)}</span>{e.version&&<span>{e.version}</span>}</span><strong>{entryTitle(e,locale)}</strong><span className="history-members">{members.map((m,i)=><span key={i}><i className={m.type}>{m.type==='new'?t.newPickup:m.type==='rerun'?t.rerunPickup:t.unknownPickup}</i>{localizedName(m.name,locale)}</span>)}{candidateCount>0&&<span>{t.selectionCandidates} {candidateCount}{e.selectionCount?` · ${t.selectionChoose} ${e.selectionCount}`:''}</span>}{!members.length&&!candidateCount&&<span><i className={e.pickupType||'unknown'}>{e.pickupType==='new'?t.newPickup:e.pickupType==='rerun'?t.rerunPickup:e.pickupType==='mixed'?t.mixedPickup:t.unknownPickup}</i></span>}</span></span>
   <span className="history-evidence"><small className={forecast?'forecast':(e.sourceKind||'official')}>{(e.sourceKind||'official')==='official'?l.official:l.community}</small><ArrowUpRight size={18}/></span>
  </button>;})}</div>}
  {!filtered.length&&<div className="history-empty"><CalendarClock size={24}/><p>{favoriteScope&&!availableGames.length?ownerUi[locale].noGames:period==='upcoming'?l.noUpcoming:l.empty}</p></div>}
  {period!=='upcoming'&&filtered.length>limit&&<button className="load-more" onClick={()=>setLimit(n=>n+30)}>{l.more}<ChevronDown size={16}/></button>}
  <div className="history-coverage">{historyDates.length>0&&<span>{l.range}: {dateLabel(historyDates[0])} — {dateLabel(historyDates.at(-1))}</span>}<p>{l.coverage}</p></div>
  <SourceFooter entries={filtered} locale={locale}/>
 </section>;
}
export function PickupArchiveDates({entry:e,locale}:{entry:Entry;locale:Locale}){
 const estimate=pickupEstimate(e);
 const zone=useDisplayZone();const {t}=useCatalog();const l=historyText[locale];const exact=(v:string)=>new Intl.DateTimeFormat(locale==='ko'?'ko-KR':locale==='ja'?'ja-JP':locale==='zh'?'zh-CN':'en-GB',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:zone}).format(new Date(v));return <><div className="detail-dates archive-detail-dates"><div><span>{t.starts}</span><strong>{e.startAt?exact(e.startAt):e.pickupArchive?.status==='forecast'?pickupStartLabel(e,locale,pickupStart(e,zone)):dateLabel(pickupStart(e,zone))}</strong></div><div><span>{t.ends}</span><strong>{e.endAt?exact(e.endAt):dateLabel(pickupEnd(e,zone))}</strong></div></div>{estimate&&<p className="timing-note"><strong>{estimate.scope==='version'?estimateText[locale].version:estimateText[locale].banner}</strong> · {estimate.basis[locale]}</p>}<p className="timing-note">{e.pickupArchive?.status==='forecast'?l.forecastNote:!e.startAt&&!e.endAt?l.dateOnly:zone}{e.pickupArchive?.note&&<> · {e.pickupArchive.note[locale]}</>}</p></>;
}
