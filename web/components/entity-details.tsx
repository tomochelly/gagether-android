'use client';
import UiText from './ui-text';
import {ui} from '@/lib/i18n';
import {ChartNoAxesCombined,ChevronDown,ShieldCheck,MessageSquare,Heart,Swords,Shield,Target,Wind,Zap,Timer,Coins,Star,TrendingUp,Activity} from 'lucide-react';
import type {EntityProfile,Locale,StatRow} from '@/lib/types';
import {useCatalog} from './catalog-context';
import {NativeIcon} from './reward-display';
import {cleanDisplayText,displaySection} from '@/lib/content-display';
import DetailCopy from './detail-copy';
import {textAppearanceStyle} from '@/lib/text-appearance';
import {traitIcon} from '@/lib/trait-icons';
import EntityMaterials from './entity-materials';
import {statIcon} from '@/lib/stat-icons';
import {traitTone} from '@/lib/trait-icons';

function StatSymbol({row,gameId}:{row:StatRow;gameId?:string}){
 const native=statIcon(gameId,row);if(native)return <NativeIcon icon={native} alt=""/>;
 const label=[row.label.en,row.label.ko,row.label.ja,row.label.zh].join(' ');
 const Icon=/HP|체력|生命|最大HP|최대 HP|health/i.test(label)?Heart:/공격력|ATK|攻撃力|攻击力|attack/i.test(label)?Swords:/방어력|DEF|防御力|防禦力|defen/i.test(label)?Shield:/치명|critical|会心|暴击|暴擊/i.test(label)?Star:/명중|accuracy|命中/i.test(label)?Target:/회피|evasion|回避|闪避|閃避/i.test(label)?Wind:/코스트|cost|費用|费用/i.test(label)?Coins:/시간|간격|time|interval|時間|间隔/i.test(label)?Timer:/속도|speed|速度/i.test(label)?Zap:/보너스|bonus|growth|성장|成長|成长/i.test(label)?TrendingUp:Activity;
 return <Icon size={20} aria-hidden="true"/>;
}
function Stats({rows,locale,gameId}:{rows:StatRow[];locale:Locale;gameId?:string}){return !!rows.length&&<dl className="entity-stat-grid">{rows.filter(row=>cleanDisplayText(row.value)).map((row,i)=><div key={i}><span className="stat-icon"><StatSymbol row={row} gameId={gameId}/></span><div className="stat-content"><dt>{row.label[locale]}</dt><dd>{cleanDisplayText(row.value)}</dd>{row.note&&cleanDisplayText(row.note[locale])&&<small>{cleanDisplayText(row.note[locale])}</small>}</div></div>)}</dl>;}
export default function EntityDetails({profiles,locale,gameId}:{profiles:EntityProfile[];locale:Locale;gameId?:string}){
 const catalog=useCatalog(),t=catalog.locale===locale?catalog.t:{...ui[locale],...catalog.settings?.ui?.[locale]};const sourceLabel=(kind:string)=>kind==='official'?t.officialNews:kind==='video'?t.videoInfo:t.communityInfo;
 return <section className="entity-details"><div className="entity-details-heading"><ChartNoAxesCombined size={20}/><h3><UiText name="entityStats">{t.entityStats}</UiText></h3></div>{profiles.map(profile=><article className="entity-profile" key={profile.id} style={textAppearanceStyle(profile.textStyle?.[locale])}>
  <header><div><small>{profile.category[locale]}</small><h4 style={textAppearanceStyle(profile.textStyle?.[locale],'title')}>{profile.name[locale]}</h4></div><span className={'stat-source '+profile.statSourceKind}>{profile.statSourceKind==='official'?<ShieldCheck size={12}/>:<MessageSquare size={12}/>} {sourceLabel(profile.statSourceKind)}</span></header>
  {!!profile.traits?.length&&<dl className="entity-traits">{profile.traits.map(trait=><div className={traitIcon(gameId,trait)?'has-native-icon':''} key={trait.id}>{traitIcon(gameId,trait)&&<span className={'trait-icon '+traitTone(gameId,trait)}><NativeIcon icon={traitIcon(gameId,trait)} alt=""/></span>}<div><dt>{trait.label[locale]}</dt><dd>{trait.value[locale]}</dd></div></div>)}</dl>}
  <Stats rows={profile.stats} locale={locale} gameId={gameId}/>
  {!!profile.materials?.length&&<EntityMaterials groups={profile.materials} locale={locale}/>}
  {cleanDisplayText(profile.basis[locale])&&!!profile.stats.length&&<details className="stat-assumptions"><summary>{{ko:'수치 기준',en:'Stat basis',ja:'数値の基準',zh:'数值基准'}[locale]}<ChevronDown size={14}/></summary><DetailCopy text={profile.basis[locale]} locale={locale} appearance={profile.textStyle?.[locale]}/></details>}
  {profile.groups.map((group,i)=>displaySection(group.title[locale],group.body[locale])&&<details className="entity-skill" key={i} open={i===0}><summary><span style={textAppearanceStyle(group.textStyle?.[locale]||profile.textStyle?.[locale],'title')}>{group.title[locale]}<small className={'stat-source '+group.sourceKind}>{sourceLabel(group.sourceKind)}</small></span><ChevronDown size={16}/></summary><DetailCopy text={group.body[locale]} locale={locale} appearance={group.textStyle?.[locale]||profile.textStyle?.[locale]}/>{!!group.rows?.length&&<Stats rows={group.rows} locale={locale} gameId={gameId}/>}</details>)}
  {!!profile.notes?.some(note=>cleanDisplayText(note[locale]))&&<ul className="stat-notes">{profile.notes.map((note,i)=>cleanDisplayText(note[locale])&&<li key={i}>{cleanDisplayText(note[locale])}</li>)}</ul>}
 </article>)}</section>;
}
