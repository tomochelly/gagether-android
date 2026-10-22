'use client';
import {useDisplayZone} from './display-time';
import {useEffect,useMemo,useState,type CSSProperties,type ReactNode} from 'react';
import {CalendarDays,ChevronLeft,ChevronRight,Clock3,ArrowUpRight,NotebookPen,Plus} from 'lucide-react';
import {entryState,type Entry,type Kind,type Locale,type Region} from '@/lib/types';
import {localeCode} from '@/lib/i18n';
import {entryTitle,regionLabel,effectiveRegion} from '@/lib/presentation';
import {activeOnDay,calendarAction,calendarGroups,calendarMarks,dayKey,deadlineUrgency,DISPLAY_ZONE,importantMarks,monthCells,moveMonth,remainingTime} from '@/lib/schedule';
import {timedSchedule,pickupStart,pickupEnd,historyText} from '@/lib/pickup-history';
import {useCatalog} from './catalog-context';
import {isNoteDate,notesForScope,weekDates,shiftNoteDate,type PersonalNote} from '@/lib/personal-notes';
import {personalUi} from '@/lib/personal-ui';
import {calendarGameName} from '@/lib/calendar-labels';
import {usePersonalNotes} from './use-personal-notes';
import {CalendarNotes,CalendarNoteEditor} from './calendar-notes';

export default function ScheduleCalendar({entries,locale,now,kind,onKind,onOpen,showGameNames=false,persistenceKey,gameFilter,noteGameId,noteRegion='global',myOnly=false,favorites=[]}:{entries:Entry[];locale:Locale;now:number;kind:Kind|'all';onKind:(kind:Kind|'all')=>void;onOpen:(entry:Entry)=>void;showGameNames?:boolean;persistenceKey?:string;gameFilter?:ReactNode;noteGameId?:string;noteRegion?:Region;myOnly?:boolean;favorites?:string[]}){
 const {t,byId,simpleMode}=useCatalog();const zone=useDisplayZone();const today=dayKey(now,zone),l=personalUi[locale];
 const [month,setMonth]=useState(today.slice(0,7));const [selected,setSelected]=useState(today);const [mode,setMode]=useState<'changes'|'active'|'notes'>('changes');
 const [fullMonth,setFullMonth]=useState(false),[noteEditor,setNoteEditor]=useState<{note?:PersonalNote}|null>(null),[noteMessage,setNoteMessage]=useState('');
 const store=usePersonalNotes();const week=simpleMode&&!fullMonth;
 const personalNotes=useMemo(()=>notesForScope(store.notes,{gameId:noteGameId,region:noteRegion,myOnly,favorites},(id,r)=>byId[id]?effectiveRegion(byId[id],r):r),[store.notes,noteGameId,noteRegion,myOnly,favorites,byId]);
 const notesByDay=useMemo(()=>{const result=new Map<string,PersonalNote[]>();for(const n of personalNotes)result.set(n.date,[...(result.get(n.date)||[]),n]);return result;},[personalNotes]);
 const selectedNotes=[...(notesByDay.get(selected)||[])].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 const scope=useMemo(()=>entries.filter(e=>timedSchedule(e)&&(kind==='all'||e.kind===kind)),[entries,kind]);
 const marks=useMemo(()=>calendarMarks(scope,zone),[scope,zone]);const cells=week?weekDates(selected):monthCells(month);const selectedMarks=importantMarks(marks.get(selected)||[],now);
 const ongoing=scope.filter(e=>activeOnDay(e,selected,today,zone)&&(selected!==today||(!e.startAt||Date.parse(e.startAt)<=now)&&(!e.endAt||Date.parse(e.endAt)>now))).sort((a,b)=>Date.parse(a.endAt||'9999-01-01')-Date.parse(b.endAt||'9999-01-01'));
 const format=(date:string,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat(localeCode[locale],{...options,timeZone:date.endsWith('T12:00:00+09:00')?'Asia/Tokyo':zone}).format(new Date(date));
 const weekdays=Array.from({length:7},(_,i)=>format(`2026-10-${String(11+i).padStart(2,'0')}T12:00:00+09:00`,{weekday:'short'}));
 const [restored,setRestored]=useState(false);
 useEffect(()=>{if(persistenceKey){try{const saved=JSON.parse(sessionStorage.getItem(persistenceKey)||'{}');if(isNoteDate(saved.month+'-01'))setMonth(saved.month);if(isNoteDate(saved.selected))setSelected(saved.selected);}catch{}}setRestored(true);},[persistenceKey]);
 useEffect(()=>{if(persistenceKey&&restored)try{sessionStorage.setItem(persistenceKey,JSON.stringify({month,selected}));}catch{}},[persistenceKey,restored,month,selected]);
 useEffect(()=>{if(noteMessage){const timer=setTimeout(()=>setNoteMessage(''),4000);return()=>clearTimeout(timer);}},[noteMessage]);
 const changeMonth=(amount:number)=>{if(week){const next=shiftNoteDate(selected,amount*7);setSelected(next);setMonth(next.slice(0,7));return;}const next=moveMonth(month,amount);setMonth(next);setSelected(next===today.slice(0,7)?today:next+'-01');};
 const rows=mode==='changes'?selectedMarks:ongoing.map(entry=>({entry,at:entry.endAt||entry.startAt||pickupEnd(entry)||pickupStart(entry)||selected,kind:'active' as const,dateOnly:!entry.endAt&&!entry.startAt}));
 return <section id="gagether-calendar" className={'schedule-calendar calendar-with-notes'+(showGameNames?' calendar-with-games':'')+(week?' calendar-week-view':'')} aria-label={t.calendar}>
  <div className="calendar-top"><div><CalendarDays size={18}/><h2>{t.calendar}</h2><span>{zone}</span>{simpleMode&&<button className="calendar-range-toggle" aria-pressed={fullMonth} onClick={()=>setFullMonth(v=>!v)}>{fullMonth?l.week:l.month}<ChevronRight size={13}/></button>}</div><div className="calendar-month"><button aria-label={week?l.prevWeek:t.prevMonth} onClick={()=>changeMonth(-1)}><ChevronLeft size={17}/></button><strong>{week?`${format(cells[0]+'T12:00:00+09:00',{month:'short',day:'numeric'})} — ${format(cells[6]+'T12:00:00+09:00',{month:'short',day:'numeric'})}`:format(month+'-01T12:00:00+09:00',{year:'numeric',month:'long'})}</strong><button aria-label={week?l.nextWeek:t.nextMonth} onClick={()=>changeMonth(1)}><ChevronRight size={17}/></button><button className="calendar-today" onClick={()=>{setMonth(today.slice(0,7));setSelected(today);}}>{t.today}</button></div></div>
  {gameFilter&&<div className="calendar-my-games">{gameFilter}</div>}
  <div className="calendar-filters" aria-label={t.filter}>{(['all','pickup','weapon','event','package'] as const).map(k=><button key={k} aria-pressed={kind===k} className={kind===k?'active':''} onClick={()=>onKind(k)}>{t[k]}</button>)}<span><i className="calendar-start-dot"/>{t.starts}<i className="calendar-end-dot"/>{t.ends}</span></div>
  <div className="calendar-layout"><div className="calendar-month-grid"><div className="calendar-weekdays">{weekdays.map((d,i)=><span key={i}>{d}</span>)}</div><div className="calendar-cells" role="group" aria-label={t.selectDate}>
   {cells.map(key=>{
    const list=marks.get(key)||[],groups=calendarGroups(list,now,showGameNames),noteCount=notesByDay.get(key)?.length||0,markerLimit=week?1:3;const urgent=list.some(m=>m.kind==='ends'&&deadlineUrgency(m.entry,now));
    return <button key={key} className={'calendar-cell'+(!week&&key.slice(0,7)!==month?' outside':'')+(key===today?' today':'')+(key===selected?' selected':'')+(urgent?' has-urgent':'')} aria-pressed={key===selected} aria-current={key===today?'date':undefined} aria-label={`${format(key+'T12:00:00+09:00',{month:'long',day:'numeric'})}, ${groups.map(g=>`${showGameNames?byId[g.marks[0].entry.gameId].name[locale]+' · ':''}${t[g.action]} ${g.marks.length}`).join(', ')}${noteCount?', '+l.notes+' '+noteCount:''}`} onClick={()=>{setSelected(key);if(key.slice(0,7)!==month)setMonth(key.slice(0,7));}}>
     <span className="calendar-day">{Number(key.slice(8))}{key===today&&<small>{t.today}</small>}</span>
     <span className="calendar-markers">{groups.slice(0,markerLimit).map(group=><span key={group.action+group.ended+group.marks[0].entry.gameId} title={group.marks.map(m=>`${byId[m.entry.gameId].name[locale]} · ${entryTitle(m.entry,locale)}`).join('\n')} className={'calendar-marker '+group.marks[0].kind+(group.ended?' is-ended':'')} style={{'--game-color':byId[group.marks[0].entry.gameId].color} as CSSProperties}>{showGameNames?<img className="calendar-marker-icon" src={byId[group.marks[0].entry.gameId].icon||byId[group.marks[0].entry.gameId].logo} alt="" loading="lazy"/>:<i/>}<span>{t[group.action]}{showGameNames&&<small className="calendar-cell-game">{calendarGameName(byId[group.marks[0].entry.gameId],locale)}</small>}</span><b>{group.marks.length}</b></span>)}{groups.length>markerLimit&&<small className="calendar-overflow">+{groups.slice(markerLimit).reduce((sum,g)=>sum+g.marks.length,0)}</small>}</span>{noteCount>0&&<span className="calendar-note-count"><NotebookPen size={10}/>{noteCount}</span>}
    </button>;
   })}
  </div></div><aside className="calendar-agenda"><div className="calendar-agenda-heading"><div className="calendar-date-heading"><h3>{format(selected+'T12:00:00+09:00',{month:'long',day:'numeric',weekday:'short'})}</h3><button className="calendar-add-note" disabled={!store.ready} onClick={()=>setNoteEditor({})}><Plus size={15}/>{l.add}</button></div><div className="calendar-agenda-tabs"><button className={mode==='changes'?'active':''} aria-pressed={mode==='changes'} onClick={()=>setMode('changes')}>{t.scheduleChanges}<b>{selectedMarks.length}</b></button><button className={mode==='active'?'active':''} aria-pressed={mode==='active'} onClick={()=>setMode('active')}>{t.now}<b>{ongoing.length}</b></button><button className={mode==='notes'?'active':''} aria-pressed={mode==='notes'} onClick={()=>setMode('notes')}><NotebookPen size={12}/>{l.notes}<b>{selectedNotes.length}</b></button></div></div>
   <div className="calendar-agenda-list">{mode==='notes'?<CalendarNotes notes={selectedNotes} store={store} locale={locale} onAdd={()=>setNoteEditor({})} onEdit={note=>setNoteEditor({note})}/>:<>{rows.map((row,i)=>{
    const e=row.entry,ended=entryState(e,now)==='ended';const urgent=row.kind!=='starts'&&deadlineUrgency(e,now);
    const action=row.kind==='active'?`${t[e.kind]} · ${t.now}`:t[calendarAction(row)];
    return <button key={e.id+row.kind+i} className={'calendar-agenda-row'+(ended?' is-ended':'')+(urgent?' urgent '+urgent:'')} onClick={()=>onOpen(e)}><img src={byId[e.gameId].icon||byId[e.gameId].logo} alt="" loading="lazy"/><span><span className={'calendar-action-label '+row.kind}>{action}{ended&&<small>{t.ended}</small>}</span><strong>{entryTitle(e,locale)}</strong><small className="calendar-game-name">{byId[e.gameId].name[locale]} · {regionLabel(byId[e.gameId],e.region,locale,t)}</small><span className="calendar-agenda-time">{row.dateOnly?historyText[locale].dateOnly:row.kind!=='active'?format(row.at,{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}):e.endAt?`${t.ends} ${format(e.endAt,{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}`:t.noEnd}</span>{urgent&&e.endAt&&<b className="calendar-urgent-time"><Clock3 size={12}/>{remainingTime(e.endAt,now,locale)} {t.left}</b>}</span><ArrowUpRight size={14}/></button>;
   })}{!rows.length&&<div className="calendar-empty"><CalendarDays size={22}/><p>{mode==='changes'?t.noDateChanges:t.emptyTitle}</p>{mode==='changes'&&ongoing.length>0&&<button onClick={()=>setMode('active')}>{t.viewOngoing} ({ongoing.length})<ChevronRight size={13}/></button>}</div>}</>}</div>
   <p className="calendar-footnote">{mode==='notes'?l.private:t.calendarNote}</p>
   {store.error&&mode!=='notes'&&<button className="calendar-note-warning" onClick={()=>setMode('notes')}>{l[store.error]}</button>}
  </aside></div>
  {noteMessage&&<p className="calendar-note-message" role="status">{noteMessage}</p>}
  {noteEditor&&<CalendarNoteEditor note={noteEditor.note} date={selected} gameId={noteGameId} region={noteRegion} locale={locale} store={store} onClose={()=>setNoteEditor(null)} onSaved={(date,message)=>{setSelected(date);setMonth(date.slice(0,7));setMode('notes');setNoteEditor(null);setNoteMessage(message);}}/>}
 </section>;
}
