'use client';
import {useState} from 'react';
import {Activity,ArrowUpRight,Heart,Shield,Sparkles,Swords} from 'lucide-react';
import {rosterCopy,type RosterCharacter} from '@/lib/character-roster';
import {rosterGrowthValue,rosterSkillDescription,rosterSkillDescriptionLocale,rosterSkillMaxLevel,rosterSkillValue} from '@/lib/character-roster-metrics';
import type {Locale,Region} from '@/lib/types';
export {rosterSkillValue} from '@/lib/character-roster-metrics';

const words={
 ko:{stats:'스테이터스',level:'캐릭터 레벨',rank:'스킬 레벨',skills:'스킬',combat:'전투 상세 능력치',baseStars:'기본 성급',basis:'수치 기준',source:'출처',original:'원문'},
 en:{stats:'Stats',level:'Character level',rank:'Skill level',skills:'Skills',combat:'Detailed combat stats',baseStars:'Base rarity',basis:'Stat basis',source:'Source',original:'Original'},
 ja:{stats:'ステータス',level:'キャラレベル',rank:'スキルレベル',skills:'スキル',combat:'戦闘詳細ステータス',baseStars:'初期レアリティ',basis:'数値の基準',source:'出典',original:'原文'},
 zh:{stats:'属性',level:'角色等级',rank:'技能等级',skills:'技能',combat:'详细战斗属性',baseStars:'初始星级',basis:'属性基准',source:'来源',original:'原文'}
};
type Stat=NonNullable<RosterCharacter['stats']>[number];
type Skill=NonNullable<RosterCharacter['skillTables']>[number];
function StatTiles({stats,locale}:{stats:Stat[];locale:Locale}){
 return <dl>{stats.map(s=>{const Icon=/^(?:hp|health|maxhp)$/i.test(s.id)?Heart:/^(?:atk|attack|attackpower)$/i.test(s.id)?Swords:/^(?:def|defense|defensepower)$/i.test(s.id)?Shield:/^(?:heal|healing|healpower)$/i.test(s.id)?Sparkles:Activity;return <div key={s.id}><dt><Icon size={15} aria-hidden="true"/>{rosterCopy(s.label,locale)}</dt><dd>{s.value}</dd></div>})}</dl>;
}
function SkillDetails({skill:s,locale,commonRank,first}:{skill:Skill;locale:Locale;commonRank:number;first:boolean}){
 const t=words[locale],[selectedRank,setRank]=useState(1),max=rosterSkillMaxLevel(s),rank=s.maxLevel?Math.min(selectedRank,max):commonRank,description=rosterSkillDescription(s,locale,rank),descriptionLocale=rosterSkillDescriptionLocale(s,locale);
 return <details className="roster-skill-table" open={first}>
  <summary>{s.icon&&<img src={s.icon} alt="" loading="lazy" decoding="async"/>}<span><strong>{rosterCopy(s.name,locale)}</strong><small>{rosterCopy(s.type,locale)}{!s.name[locale]||descriptionLocale&&descriptionLocale!==locale?' · '+t.original+(descriptionLocale&&descriptionLocale!==locale?' · '+descriptionLocale.toUpperCase():''):''}</small></span></summary>
  {s.maxLevel&&max>1&&<label className="roster-skill-level">{t.rank}<select aria-label={rosterCopy(s.name,locale)+' · '+t.rank} value={rank} onChange={e=>setRank(Number(e.target.value))}>{Array.from({length:max},(_,i)=><option key={i} value={i+1}>Lv.{i+1}</option>)}</select></label>}
  {description&&<p className="roster-skill-description">{description}</p>}
  {!!s.values.length&&<dl>{s.values.map(v=>{const value=rosterSkillValue(v.levels,rank);return value!==undefined&&value!==''?<div key={v.id}><dt>{rosterCopy(v.label,locale)}</dt><dd>{value}</dd></div>:null})}</dl>}
  <details className="roster-skill-basis"><summary>{t.basis}</summary><p>{rosterCopy(s.basis,locale)}</p><a className="reference-source-link" href={s.sourceUrl} target="_blank" rel="noreferrer">{t.source}<ArrowUpRight size={13}/></a></details>
 </details>;
}
export default function RosterStatDetails({character:c,locale,service}:{character:RosterCharacter;locale:Locale;service:Region}){
 const t=words[locale],progression=c.statProgression,growth=c.statGrowth,tables=(c.skillTables||[]).filter(s=>!s.regions||s.regions.includes(service)),[requestedLevel,setLevel]=useState<number>(),[rank,setRank]=useState(1);
 const row=progression?.rows.find(r=>r.level===requestedLevel)||progression?.rows.at(-1),level=growth?Math.min(growth.maxLevel,Math.max(growth.minLevel,requestedLevel||growth.maxLevel)):row?.level;
 const metrics=growth?.stats.map(s=>({...s,value:rosterGrowthValue(growth,s,level!),basis:growth.basis}))||progression?.stats.map(s=>({...s,value:row?.values[s.id],basis:progression.basis}));
 const computed=new Map(metrics?.map(s=>[s.id,s])||[]),stats=[...(c.regionalStats?.[service]||c.stats||[])].map(s=>{const v=computed.get(s.id);computed.delete(s.id);return v?.value!==undefined?{...s,value:v.value,basis:v.basis}:s;});
 for(const s of computed.values())if(s.value!==undefined)stats.push({id:s.id,label:s.label,value:s.value,basis:s.basis});
 const coreIds=new Set(growth?.stats.map(s=>s.id)),primary=growth?stats.filter(s=>coreIds.has(s.id)):stats,secondary=growth?stats.filter(s=>!coreIds.has(s.id)):[],levels=growth?Array.from({length:growth.maxLevel-growth.minLevel+1},(_,i)=>i+growth.minLevel):progression?.rows.map(r=>r.level).sort((a,b)=>a-b),maxRank=Math.max(1,...tables.filter(s=>!s.maxLevel).map(rosterSkillMaxLevel));
 return <>
  {!!stats.length&&<section className="roster-stats"><header><h3>{t.stats}</h3>{levels&&level&&<label>{t.level}<select aria-label={t.level} value={level} onChange={e=>setLevel(Number(e.target.value))}>{levels.map(v=><option value={v} key={v}>Lv.{v}</option>)}</select></label>}</header>
   {growth&&<p className="roster-stat-context">{t.baseStars} · {growth.starGrade} ★</p>}
   <StatTiles stats={primary} locale={locale}/>
   {!!secondary.length&&<details className="roster-combat-stats"><summary>{t.combat}</summary><StatTiles stats={secondary} locale={locale}/></details>}
   <details><summary>{t.basis}</summary>{[...new Set(stats.map(s=>rosterCopy(s.basis,locale)))].map(b=><p key={b}>{b}</p>)}{(growth||progression)&&<a className="reference-source-link" href={(growth||progression)!.sourceUrl} target="_blank" rel="noreferrer">{t.source}<ArrowUpRight size={13}/></a>}</details>
  </section>}
  {!!tables.length&&<section className="roster-skill-tables"><header><h3>{t.skills}</h3>{maxRank>1&&<label>{t.rank}<select aria-label={t.rank} value={rank} onChange={e=>setRank(Number(e.target.value))}>{Array.from({length:maxRank},(_,i)=><option key={i} value={i+1}>Lv.{i+1}</option>)}</select></label>}</header>
   {tables.map((s,index)=><SkillDetails key={s.id} skill={s} locale={locale} commonRank={rank} first={index===0}/>)}
  </section>}
 </>;
}
