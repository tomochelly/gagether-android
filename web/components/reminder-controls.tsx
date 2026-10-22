'use client';
import {useState} from 'react';
import {Plus,X} from 'lucide-react';
import {notificationText,offsetLabel} from '@/lib/notification-i18n';
import {reminderKinds,cleanOffsets,type ReminderKind,type ReminderRules} from '@/lib/notification-settings';
import type {Locale} from '@/lib/types';
import {useCatalog} from './catalog-context';
export function ReminderControls({locale,rules,onChange}:{locale:Locale;rules:ReminderRules;onChange:(rules:ReminderRules)=>void}){
 const l=notificationText[locale],{t}=useCatalog();const [kind,setKind]=useState<ReminderKind>('pickup');
 const [custom,setCustom]=useState(''),[unit,setUnit]=useState(1440),[customEvent,setCustomEvent]=useState<'start'|'end'>('end');
 const rule=rules[kind];
 const update=(patch:Partial<typeof rule>)=>onChange({...rules,[kind]:{...rule,...patch}});
 const toggle=(event:'start'|'end',minutes:number)=>{const key=event==='start'?'startOffsets':'endOffsets',values=rule[key];update({[key]:values.includes(minutes)?values.filter(v=>v!==minutes):cleanOffsets([...values,minutes])});};
 const amount=Number(custom)*unit,valid=custom!==''&&Number.isInteger(amount)&&amount>=0&&amount<=10080&&rule[customEvent==='start'?'startOffsets':'endOffsets'].length<8;
 return <section className="reminder-rules"><h3>{l.rules}</h3><div className="reminder-kind-tabs">{reminderKinds.map(k=><button key={k} aria-pressed={kind===k} onClick={()=>{setKind(k);setCustom('');}}>{t[k]}</button>)}</div>
 {(['start','end'] as const).map(event=>{const enabled=event==='start'?'starts':'ends',key=event==='start'?'startOffsets':'endOffsets';return <div className="reminder-rule" key={event}><label className="companion-option"><strong>{l[event]}</strong><input type="checkbox" checked={rule[enabled]} onChange={e=>update({[enabled]:e.target.checked})}/></label>{rule[enabled]&&<><div className="companion-chips">{[4320,2880,1440,60,0].map(m=><button key={m} aria-pressed={rule[key].includes(m)} disabled={!rule[key].includes(m)&&rule[key].length>=8} onClick={()=>toggle(event,m)}>{offsetLabel(m,locale)}</button>)}{rule[key].filter(m=>![4320,2880,1440,60,0].includes(m)).map(m=><button key={m} aria-pressed="true" onClick={()=>toggle(event,m)}>{offsetLabel(m,locale)}<X size={12}/></button>)}</div>{!rule[key].length&&<p className="companion-hint">{l.empty}</p>}</>}</div>;})}
 <div className="reminder-custom"><label><span>{l.custom}</span><input type="number" inputMode="numeric" min="0" max={10080/unit} step="1" value={custom} onChange={e=>setCustom(e.target.value)}/></label><select aria-label={l.custom} value={unit} onChange={e=>setUnit(Number(e.target.value))}><option value={1440}>{l.days}</option><option value={60}>{l.hours}</option><option value={1}>{l.minutes}</option></select><select aria-label={l.rules} value={customEvent} onChange={e=>setCustomEvent(e.target.value as 'start'|'end')}><option value="start">{l.start}</option><option value="end">{l.end}</option></select><button disabled={!valid} onClick={()=>{const key=customEvent==='start'?'startOffsets':'endOffsets';update({[key]:cleanOffsets([...rule[key],amount]),[customEvent==='start'?'starts':'ends']:true});setCustom('');}}><Plus size={15}/>{l.add}</button></div><p className="companion-hint">{l.limit}</p></section>;
}
