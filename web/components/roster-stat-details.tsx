'use client';
import {useState} from 'react';
import RosterSourceLink from './roster-source-link';
import {Activity,Heart,Shield,Sparkles,Swords} from 'lucide-react';
import {rosterCopy,type RosterCharacter} from '@/lib/character-roster';
import {rosterGrowthValue,rosterSkillDescription,rosterSkillDescriptionLocale,rosterSkillMaxLevel,rosterSkillValue} from '@/lib/character-roster-metrics';
import {progressionRows} from '@/lib/roster-progression';
import type {Locale,Region} from '@/lib/types';
export {rosterSkillValue} from '@/lib/character-roster-metrics';

const words={
 ko:{stats:'스테이터스',level:'캐릭터 레벨',stage:'정예화',condition:'조건',rank:'스킬 레벨',skills:'스킬',combat:'전투 상세 능력치',baseStars:'기본 성급',basis:'수치 기준',source:'출처',original:'원문'},
 en:{stats:'Stats',level:'Character level',stage:'Promotion',condition:'Condition',rank:'Skill level',skills:'Skills',combat:'Detailed combat stats',baseStars:'Base rarity',basis:'Stat basis',source:'Source',original:'Original'},
 ja:{stats:'ステータス',level:'キャラレベル',stage:'昇進',condition:'条件',rank:'スキルレベル',skills:'スキル',combat:'戦闘詳細ステータス',baseStars:'初期レアリティ',basis:'数値の基準',source:'出典',original:'原文'},
 zh:{stats:'属性',level:'角色等级',stage:'晋升',condition:'条件',rank:'技能等级',skills:'技能',combat:'详细战斗属性',baseStars:'初始星级',basis:'属性基准',source:'来源',original:'原文'}
};
type Stat=NonNullable<RosterCharacter['stats']>[number];
type Skill=NonNullable<RosterCharacter['skillTables']>[number];
/** Native monochrome glyphs keep their original pixels on a readable swatch. */
export function RosterFactIcon({src,fallback:Fallback}:{src?:string;fallback?:typeof Activity}){
 const [failed,setFailed]=useState('');
 const pinned=src&&/^https:\/\/gagether\.wiki(\/roster-detail-icons\/[a-f0-9]{64}\.(?:png|webp|jpg|svg))$/.exec(src);
 return src&&failed!==src?<img className="roster-native-icon" src={pinned?pinned[1]:src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(src)}/>:Fallback?<Fallback size={15} aria-hidden="true"/>:null;
}
function StatTiles({stats,locale}:{stats:Stat[];locale:Locale}){
 return <dl>{stats.map(s=>{const Icon=/^(?:hp|health|maxhp)$/i.test(s.id)?Heart:/^(?:atk|attack|attackpower)$/i.test(s.id)?Swords:/^(?:def|defense|defensepower)$/i.test(s.id)?Shield:/^(?:heal|healing|healpower)$/i.test(s.id)?Sparkles:Activity;return <div key={s.id}><dt><RosterFactIcon src={s.icon} fallback={Icon}/>{rosterCopy(s.label,locale)}</dt><dd>{s.value}</dd></div>})}</dl>;
}
function SkillDetails({skill:s,locale,commonRank,first}:{skill:Skill;locale:Locale;commonRank:number;first:boolean}){
 const t=words[locale],[selectedRank,setRank]=useState(1),max=rosterSkillMaxLevel(s),rank=s.maxLevel?Math.min(selectedRank,max):commonRank,description=rosterSkillDescription(s,locale,rank),descriptionLocale=rosterSkillDescriptionLocale(s,locale),rankLabel=/^(?:talent|trait):/.test(s.id)?t.condition:t.rank;
 return <details className="roster-skill-table" open={first}>
  <summary><RosterFactIcon src={s.icon}/><span><strong>{rosterCopy(s.name,locale)}</strong><small>{rosterCopy(s.type,locale)}{!s.name[locale]||descriptionLocale&&descriptionLocale!==locale?' · '+t.original+(descriptionLocale&&descriptionLocale!==locale?' · '+descriptionLocale.toUpperCase():''):''}</small></span></summary>
  {s.maxLevel&&max>1&&<label className="roster-skill-level">{rankLabel}<select aria-label={rosterCopy(s.name,locale)+' · '+rankLabel} value={rank} onChange={e=>setRank(Number(e.target.value))}>{Array.from({length:max},(_,i)=><option key={i} value={i+1}>{s.levelLabels?.[i]?rosterCopy(s.levelLabels[i],locale):'Lv.'+(i+1)+(s.baseMaxLevel&&i+1>s.baseMaxLevel?' · '+({ko:'성혼 보너스 포함',en:'With Eidolon bonus',ja:'星魂ボーナス込み',zh:'含星魂加成'})[locale]:'')}</option>)}</select></label>}
  {description&&<p className="roster-skill-description">{description}</p>}
  {!!s.values.length&&<dl>{s.values.map(v=>{const value=rosterSkillValue(v.levels,rank);return value!==undefined&&value!==''?<div key={v.id}><dt><RosterFactIcon src={v.icon}/>{rosterCopy(v.label,locale)}</dt><dd>{value}</dd></div>:null})}</dl>}
  <details className="roster-skill-basis"><summary>{t.basis}</summary><p>{rosterCopy(s.basis,locale)}</p><RosterSourceLink href={s.sourceUrl} locale={locale}>{t.source}</RosterSourceLink></details>
 </details>;
}
export default function RosterStatDetails({character:c,locale,service,gameId}:{character:RosterCharacter;locale:Locale;service:Region;gameId?:string}){
 const t=words[locale],progression=c.regionalStatProgression?.[service]||c.statProgression,growth=c.statGrowth,allTables=(c.regionalSkillTables?.[service]||c.skillTables||[]).filter(s=>!s.regions||s.regions.includes(service)),[requestedLevel,setLevel]=useState<number>(),[requestedStage,setStage]=useState<number>(),[rank,setRank]=useState(1);
 // Amiya class conversion requires Elite2; lower client template keyframes
 // remain preserved as originals, but are not offered as playable promotions.
 const stages=progression?.stages?.filter(s=>gameId!=='arknights'||!['char_1001_amiya2','char_1037_amiya3'].includes(c.id)||s.id===2);
 const stage=stages?.find(s=>s.id===requestedStage)?.id??stages?.at(-1)?.id,stageLabel=rosterCopy(progression?.stageLabel,locale)||t.stage,availableRows=progression?progressionRows(progression,stage):undefined;
 const row=availableRows?.find(r=>r.level===(requestedLevel??progression?.defaultLevel))||availableRows?.at(-1),level=growth?Math.min(growth.maxLevel,Math.max(growth.minLevel,requestedLevel||growth.maxLevel)):row?.level,levelLabel=rosterCopy(progression?.levelLabel,locale)||t.level;
 const stars=progression?.levelPrefix==='★'?level:c.rarity,tables=allTables.filter(s=>(!s.minStars||stars===undefined||stars>=s.minStars)&&(!s.maxStars||stars===undefined||stars<=s.maxStars));
 const metrics:(Omit<Stat,'value'>&{value?:string})[]|undefined=growth?.stats.map(s=>({...s,value:rosterGrowthValue(growth,s,level!),basis:growth.basis}))||progression?.stats.map(s=>({...s,value:row?.values[s.id],basis:s.basis||progression.basis}));
 const computed=new Map(metrics?.map(s=>[s.id,s])||[]),stats=[...(c.regionalStats?.[service]||c.stats||[])].map(s=>{const v=computed.get(s.id);computed.delete(s.id);return v?.value!==undefined?{...s,label:v.label,value:v.value,basis:v.basis,icon:v.icon||s.icon,...v.group?{group:v.group}:{}}:s;});
 for(const s of computed.values())if(s.value!==undefined)stats.push({id:s.id,label:s.label,value:s.value,basis:s.basis,...s.icon?{icon:s.icon}:{},...s.group?{group:s.group}:{}});
 const coreIds=new Set(growth?.stats.map(s=>s.id)),primary=growth?stats.filter(s=>coreIds.has(s.id)):stats.filter(s=>s.group!=='detail'),secondary=growth?stats.filter(s=>!coreIds.has(s.id)):stats.filter(s=>s.group==='detail'),levels=growth?Array.from({length:growth.maxLevel-growth.minLevel+1},(_,i)=>i+growth.minLevel):availableRows?.map(r=>r.level),maxRank=Math.max(1,...tables.filter(s=>!s.maxLevel).map(rosterSkillMaxLevel));
 return <>
  {!!stats.length&&<section className="roster-stats"><header><h3>{t.stats}</h3>{levels&&level&&<div className="roster-level-controls">{stages&&<label>{stageLabel}<select aria-label={stageLabel} value={stage} onChange={e=>{setStage(Number(e.target.value));setLevel(undefined)}}>{stages.map(s=><option key={s.id} value={s.id}>{rosterCopy(s.label,locale)}</option>)}</select></label>}<label>{levelLabel}<select aria-label={levelLabel} value={level} onChange={e=>setLevel(Number(e.target.value))}>{levels.map(v=><option value={v} key={v}>{progression?.levelPrefix==='★'?v+' ★':(progression?.levelPrefix||'Lv.')+v}</option>)}</select></label></div>}</header>
   {growth&&<p className="roster-stat-context">{t.baseStars} · {growth.starGrade} ★</p>}
   <StatTiles stats={primary} locale={locale}/>
   {!!secondary.length&&<details className="roster-combat-stats"><summary>{rosterCopy(c.statDetailLabel,locale)||t.combat}</summary><StatTiles stats={secondary} locale={locale}/></details>}
   <details><summary>{t.basis}</summary>{[...new Set(stats.map(s=>rosterCopy(s.basis,locale)))].map(b=><p key={b}>{b}</p>)}{(growth||progression)&&<RosterSourceLink href={(growth||progression)!.sourceUrl} locale={locale}>{t.source}</RosterSourceLink>}</details>
  </section>}
  {!!tables.length&&<section data-character-section="skills" className="roster-skill-tables"><header><h3>{t.skills}</h3>{maxRank>1&&<label>{t.rank}<select aria-label={t.rank} value={rank} onChange={e=>setRank(Number(e.target.value))}>{Array.from({length:maxRank},(_,i)=><option key={i} value={i+1}>Lv.{i+1}</option>)}</select></label>}</header>
   {tables.map((s,index)=><SkillDetails key={s.id} skill={s} locale={locale} commonRank={rank} first={index===0}/>)}
  </section>}
 </>;
}
