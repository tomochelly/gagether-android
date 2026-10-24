'use client';
import {useState} from 'react';
import {Activity,ArrowUpRight,Heart,Shield,Swords} from 'lucide-react';
import {rosterCopy,type RosterCharacter} from '@/lib/character-roster';
import type {Locale,Region} from '@/lib/types';

const words={
 ko:{stats:'스테이터스',level:'캐릭터 레벨',rank:'스킬 레벨',skills:'스킬 수치',basis:'수치 기준',source:'출처',original:'원문'},
 en:{stats:'Stats',level:'Character level',rank:'Skill level',skills:'Skill scaling',basis:'Stat basis',source:'Source',original:'Original'},
 ja:{stats:'ステータス',level:'キャラレベル',rank:'スキルレベル',skills:'スキル倍率',basis:'数値の基準',source:'出典',original:'原文'},
 zh:{stats:'属性',level:'角色等级',rank:'技能等级',skills:'技能倍率',basis:'属性基准',source:'来源',original:'原文'}
};
export function rosterSkillValue(levels:string[],rank:number){return levels.length===1?levels[0]:levels[rank-1]||undefined;}
export default function RosterStatDetails({character:c,locale,service}:{character:RosterCharacter;locale:Locale;service:Region}){
 const t=words[locale],progression=c.statProgression,tables=c.skillTables||[],[requestedLevel,setLevel]=useState(progression?.rows.at(-1)?.level||1),[rank,setRank]=useState(1);
 const row=progression?.rows.find(r=>r.level===requestedLevel)||progression?.rows.at(-1);
 const stats=[...(c.regionalStats?.[service]||c.stats||[])].map(s=>row?.values[s.id]!==undefined?{...s,value:row.values[s.id],basis:progression!.basis}:s);
 for(const s of progression?.stats||[])if(!stats.some(v=>v.id===s.id)&&row?.values[s.id]!==undefined)stats.push({...s,value:row.values[s.id],basis:progression!.basis});
 const maxRank=Math.max(1,...tables.flatMap(s=>s.values.map(v=>v.levels.length)));
 return <>
  {!!stats.length&&<section className="roster-stats"><header><h3>{t.stats}</h3>{progression&&row&&<label>{t.level}<select aria-label={t.level} value={row.level} onChange={e=>setLevel(Number(e.target.value))}>{[...progression.rows].sort((a,b)=>a.level-b.level).map(r=><option value={r.level} key={r.level}>Lv.{r.level}</option>)}</select></label>}</header>
   <dl>{stats.map(s=>{const Icon=/^(?:hp|health)$/i.test(s.id)?Heart:/^(?:atk|attack)$/i.test(s.id)?Swords:/^(?:def|defense)$/i.test(s.id)?Shield:Activity;return <div key={s.id}><dt><Icon size={15} aria-hidden="true"/>{rosterCopy(s.label,locale)}</dt><dd>{s.value}</dd></div>})}</dl>
   <details><summary>{t.basis}</summary>{[...new Set(stats.map(s=>rosterCopy(s.basis,locale)))].map(b=><p key={b}>{b}</p>)}{progression&&<a className="reference-source-link" href={progression.sourceUrl} target="_blank" rel="noreferrer">{t.source}<ArrowUpRight size={13}/></a>}</details>
  </section>}
  {!!tables.length&&<section className="roster-skill-tables"><header><h3>{t.skills}</h3>{maxRank>1&&<label>{t.rank}<select aria-label={t.rank} value={rank} onChange={e=>setRank(Number(e.target.value))}>{Array.from({length:maxRank},(_,i)=><option key={i} value={i+1}>Lv.{i+1}</option>)}</select></label>}</header>
   {tables.map((s,index)=><details key={s.id} className="roster-skill-table" open={index===0}><summary>{s.icon&&<img src={s.icon} alt="" loading="lazy" decoding="async"/>}<span><strong>{rosterCopy(s.name,locale)}</strong><small>{rosterCopy(s.type,locale)}{!s.name[locale]?' · '+t.original:''}</small></span></summary>
    {s.description&&<p>{rosterCopy(s.description,locale)}</p>}<dl>{s.values.map(v=>{const value=rosterSkillValue(v.levels,rank);return value!==undefined&&value!==''?<div key={v.id}><dt>{rosterCopy(v.label,locale)}</dt><dd>{value}</dd></div>:null})}</dl>
    <details className="roster-skill-basis"><summary>{t.basis}</summary><p>{rosterCopy(s.basis,locale)}</p><a className="reference-source-link" href={s.sourceUrl} target="_blank" rel="noreferrer">{t.source}<ArrowUpRight size={13}/></a></details>
   </details>)}
  </section>}
 </>;
}
