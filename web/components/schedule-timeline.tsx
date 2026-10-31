'use client';
import {useMemo,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,SlidersHorizontal,CalendarRange,Play,Flag} from 'lucide-react';
import type {Entry,Locale} from '@/lib/types';
import {localeCode} from '@/lib/i18n';
import {entryTitle} from '@/lib/presentation';
import {calendarAction} from '@/lib/schedule';
import {timelineGroups,timelineGameGroups} from '@/lib/schedule-timeline';
import {calendarDisplayText} from '@/lib/calendar-display-i18n';
import {useDisplayZone} from './display-time';
import {useCalendarPreferences} from './use-calendar-preferences';
import {SchedulePresets,ScheduleTypeSelection,ScheduleGameSelection,scheduleSelectionCopy} from './schedule-selection';
import {useCatalog} from './catalog-context';
const copy={ko:{title:'일정 한눈에',days:'일',empty:'선택한 항목의 예정 일정이 없어요.',prev:'이전 일정',next:'다음 일정',more:'더 보기',less:'접기'},en:{title:'Schedule at a glance',days:'days',empty:'No upcoming dates for these selections.',prev:'Previous dates',next:'Next dates',more:'Show more',less:'Show less'},ja:{title:'予定をひと目で',days:'日',empty:'選択した項目の予定はありません。',prev:'前の予定',next:'次の予定',more:'もっと見る',less:'閉じる'},zh:{title:'日程一览',days:'天',empty:'所选项目暂无后续日程。',prev:'之前的日程',next:'之后的日程',more:'展开',less:'收起'}};
export default function ScheduleTimeline({entries,locale,now,onOpen,gameId,myOnly=false,favorites=[]}:{entries:Entry[];locale:Locale;now:number;onOpen:(e:Entry)=>void;gameId?:string;myOnly?:boolean;favorites?:string[]}){
 const {t,byId,games}=useCatalog(),zone=useDisplayZone(),display=useCalendarPreferences(gameId,myOnly),c=copy[locale],selection=scheduleSelectionCopy[locale],settings=calendarDisplayText[locale],track=useRef<HTMLDivElement>(null),[days,setDays]=useState(30),[expanded,setExpanded]=useState<string[]>([]);
 const groups=useMemo(()=>timelineGroups(entries,display.value,favorites,gameId,now,zone,days),[entries,display.value,favorites,gameId,now,zone,days]);
 const date=(key:string)=>new Intl.DateTimeFormat(localeCode[locale],{month:'short',day:'numeric',weekday:'short',timeZone:'UTC'}).format(new Date(key+'T12:00:00Z'));
 const scroll=(direction:number)=>track.current?.scrollBy({left:direction*Math.max(240,track.current.clientWidth*.8),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 return <section className="schedule-timeline" id="gagether-timeline" aria-label={c.title}>
  <header><h2><CalendarRange size={17}/>{c.title}</h2><SchedulePresets display={display} locale={locale}/><div className="timeline-legend"><span className="schedule-action starts"><Play size={11}/>{t.starts}</span><span className="schedule-action ends"><Flag size={11}/>{t.ends}</span></div><div className="timeline-tools"><select aria-label={c.title+' · '+c.days} value={days} onChange={e=>setDays(Number(e.target.value))}>{[14,30,60].map(d=><option key={d} value={d}>{d} {c.days}</option>)}</select><button aria-label={c.prev} onClick={()=>scroll(-1)}><ChevronLeft size={16}/></button><button aria-label={c.next} onClick={()=>scroll(1)}><ChevronRight size={16}/></button></div></header>
  <details className="timeline-options" onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary')?.focus();}}}><summary><SlidersHorizontal size={14}/>{settings.settings}</summary><div><p>{display.error?settings.failed:selection.shared}</p><ScheduleTypeSelection display={display} locale={locale}/>{!gameId&&<ScheduleGameSelection display={display} locale={locale}/>}</div></details>
  <div ref={track} className="timeline-track" tabIndex={0} aria-label={c.title}>{groups.length?groups.map(group=><div className="timeline-date" key={group.date}><time dateTime={group.date}>{date(group.date)}</time><i aria-hidden="true"/><div className="timeline-date-items">{timelineGameGroups(group.marks,games.map(g=>g.id)).map(bucket=>{
   const g=byId[bucket.gameId],key=group.date+':'+bucket.gameId,isExpanded=expanded.includes(key),label=g?.name[locale]||bucket.gameId;
   return <section className="timeline-game-group" key={bucket.gameId} aria-label={label} data-game={bucket.gameId}><header>{g&&<img src={g.icon||g.logo} alt="" loading="lazy"/>}<h3>{label}</h3><small>{bucket.marks.length}</small></header><div className="timeline-game-items">{bucket.marks.slice(0,isExpanded?undefined:2).map(mark=>{const e=mark.entry;return <button key={e.id+mark.kind} className={'timeline-entry '+mark.kind} onClick={()=>onOpen(e)}><span className="timeline-entry-meta"><b className={'schedule-action '+mark.kind}>{mark.kind==='starts'?<Play size={11}/>:<Flag size={11}/>} {t[calendarAction(mark)]}</b>{!mark.dateOnly&&<time dateTime={mark.at}>{new Intl.DateTimeFormat(localeCode[locale],{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:zone}).format(new Date(mark.at))}</time>}</span><strong>{entryTitle(e,locale)}</strong></button>;})}</div>{bucket.marks.length>2&&<button className="timeline-more" aria-label={label+' · '+(isExpanded?c.less:c.more)} aria-expanded={isExpanded} onClick={()=>setExpanded(v=>v.includes(key)?v.filter(k=>k!==key):[...v,key])}>{isExpanded?c.less:`+${bucket.marks.length-2} · ${c.more}`}</button>}</section>;
  })}</div></div>):<p className="timeline-empty">{c.empty}</p>}</div>
 </section>;
}
