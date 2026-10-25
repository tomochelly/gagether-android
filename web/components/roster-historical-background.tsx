'use client';
import {useState} from 'react';
import {ArrowUpRight,BookOpen,ChevronDown} from 'lucide-react';
import {rosterCopy,type RosterCharacter} from '@/lib/character-roster';
import type {Locale} from '@/lib/types';
const words={ko:{title:'모티브 경주마',context:'실제 경주마의 기록',source:'출처',official:'공식',community:'커뮤니티',original:'원문'},en:{title:'Racehorse inspiration',context:'Historical racehorse record',source:'Sources',official:'Official',community:'Community',original:'Original'},ja:{title:'モチーフとなった競走馬',context:'実在の競走馬の記録',source:'出典',official:'公式',community:'コミュニティ',original:'原文'},zh:{title:'原型赛马',context:'真实赛马记录',source:'来源',official:'官方',community:'社区',original:'原文'}};
/** History is optional reading; closed panels do not mount the biography. */
export default function RosterHistoricalBackground({background:b,locale}:{background:RosterCharacter['historicalBackground'];locale:Locale}){
 const [open,setOpen]=useState(false);if(!b)return null;const t=words[locale];
 return <details className="roster-history" onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary><BookOpen size={20} aria-hidden="true"/><span><strong>{t.title}</strong><small>{rosterCopy(b.name,locale)} · {t.context}</small></span><ChevronDown size={17} aria-hidden="true"/></summary>
  {open&&<div className="roster-history-body"><h3>{rosterCopy(b.name,locale)}</h3>{!b.name[locale]&&<small>{t.original}</small>}{rosterCopy(b.summary,locale)&&<p>{rosterCopy(b.summary,locale)}</p>}<dl>{b.facts.filter(f=>rosterCopy(f.value,locale)).map(f=><div key={f.id}><dt>{rosterCopy(f.label,locale)}</dt><dd>{rosterCopy(f.value,locale)}</dd></div>)}</dl>{b.sections?.filter(s=>rosterCopy(s.body,locale)).map(s=><section key={s.id}><h4>{rosterCopy(s.title,locale)}</h4><p>{rosterCopy(s.body,locale)}</p></section>)}<details className="roster-history-sources"><summary>{t.source}</summary>{b.sources.map(s=><a key={s.url} className="reference-source-link" href={s.url} target="_blank" rel="noreferrer">{s.label?rosterCopy(s.label,locale):new URL(s.url).hostname} · {s.kind==='official'?t.official:t.community}<ArrowUpRight size={13}/></a>)}</details></div>}
 </details>;
}
