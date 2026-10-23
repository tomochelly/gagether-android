'use client';
import {ChartNoAxesCombined,ChevronDown,ShieldCheck,MessageSquare,Heart,Swords,Shield,Target,Wind,Zap,Timer,Coins,Star,TrendingUp,Activity} from 'lucide-react';
import type {EntityProfile,Locale,StatRow} from '@/lib/types';
import {useCatalog} from './catalog-context';
import {NativeIcon} from './reward-display';
import {cleanDisplayText,displaySection} from '@/lib/content-display';
import DetailCopy from './detail-copy';
import {traitIcon} from '@/lib/trait-icons';

function StatSymbol({row}:{row:StatRow}){
 if(row.icon)return <NativeIcon icon={row.icon} alt=""/>;
 const label=[row.label.en,row.label.ko,row.label.ja,row.label.zh].join(' ');
 const Icon=/HP|체력|生命|最大HP|최대 HP|health/i.test(label)?Heart:/공격력|ATK|攻撃力|攻击力|attack/i.test(label)?Swords:/방어력|DEF|防御力|防禦力|defen/i.test(label)?Shield:/치명|critical|会心|暴击|暴擊/i.test(label)?Star:/명중|accuracy|命中/i.test(label)?Target:/회피|evasion|回避|闪避|閃避/i.test(label)?Wind:/코스트|cost|費用|费用/i.test(label)?Coins:/시간|간격|time|interval|時間|间隔/i.test(label)?Timer:/속도|speed|速度/i.test(label)?Zap:/보너스|bonus|growth|성장|成長|成长/i.test(label)?TrendingUp:Activity;
 return <Icon size={20} aria-hidden="true"/>;
}
function Stats({rows,locale}:{rows:StatRow[];locale:Locale}){return !!rows.length&&<dl className="entity-stat-grid">{rows.filter(row=>cleanDisplayText(row.value)).map((row,i)=><div key={i}><span className="stat-icon"><StatSymbol row={row}/></span><div className="stat-content"><dt>{row.label[locale]}</dt><dd>{cleanDisplayText(row.value)}</dd>{row.note&&cleanDisplayText(row.note[locale])&&<small>{cleanDisplayText(row.note[locale])}</small>}</div></div>)}</dl>;}
export default function EntityDetails({profiles,locale,gameId}:{profiles:EntityProfile[];locale:Locale;gameId?:string}){
 const {t}=useCatalog();const sourceLabel=(kind:string)=>kind==='official'?t.officialNews:kind==='video'?t.videoInfo:t.communityInfo;
 return <section className="entity-details"><div className="entity-details-heading"><ChartNoAxesCombined size={20}/><h3>{t.entityStats}</h3></div>{profiles.map(profile=><article className="entity-profile" key={profile.id}>
  <header><div><small>{profile.category[locale]}</small><h4>{profile.name[locale]}</h4></div><span className={'stat-source '+profile.statSourceKind}>{profile.statSourceKind==='official'?<ShieldCheck size={12}/>:<MessageSquare size={12}/>} {sourceLabel(profile.statSourceKind)}</span></header>
  {!!profile.traits?.length&&<dl className="entity-traits">{profile.traits.map(trait=><div className={traitIcon(gameId,trait)?'has-native-icon':''} key={trait.id}>{traitIcon(gameId,trait)&&<span className="trait-icon"><NativeIcon icon={traitIcon(gameId,trait)} alt=""/></span>}<div><dt>{trait.label[locale]}</dt><dd>{trait.value[locale]}</dd></div></div>)}</dl>}
  <Stats rows={profile.stats} locale={locale}/>
  {cleanDisplayText(profile.basis[locale])&&!!profile.stats.length&&<details className="stat-assumptions"><summary>{{ko:'수치 기준',en:'Stat basis',ja:'数値の基準',zh:'数值基准'}[locale]}<ChevronDown size={14}/></summary><DetailCopy text={profile.basis[locale]} locale={locale}/></details>}
  {profile.groups.map((group,i)=>displaySection(group.title[locale],group.body[locale])&&<details className="entity-skill" key={i} open={i===0}><summary><span>{group.title[locale]}<small className={'stat-source '+group.sourceKind}>{sourceLabel(group.sourceKind)}</small></span><ChevronDown size={16}/></summary><DetailCopy text={group.body[locale]} locale={locale}/>{!!group.rows?.length&&<Stats rows={group.rows} locale={locale}/>}</details>)}
  {!!profile.notes?.some(note=>cleanDisplayText(note[locale]))&&<ul className="stat-notes">{profile.notes.map((note,i)=>cleanDisplayText(note[locale])&&<li key={i}>{cleanDisplayText(note[locale])}</li>)}</ul>}
 </article>)}</section>;
}
