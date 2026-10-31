'use client';
import UiText from './ui-text';
import {EntryEdit,EntryField} from './owner-inline';
import CharacterSectionNav from './character-section-nav';
import {ui} from '@/lib/i18n';
import {ChartNoAxesCombined,ChevronDown,Heart,Swords,Shield,Target,Wind,Zap,Timer,Coins,Star,TrendingUp,Activity} from 'lucide-react';
import type {EntityProfile,Locale,StatRow,Entry} from '@/lib/types';
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
function Stats({rows,locale,gameId,entry,path}:{rows:StatRow[];locale:Locale;gameId?:string;entry?:Entry;path?:string}){return !!rows.length&&<dl className="entity-stat-grid">{rows.filter(row=>cleanDisplayText(row.value)).map((row,i)=><div key={i}><span className="stat-icon"><StatSymbol row={row} gameId={gameId}/></span><div className="stat-content"><dt>{row.label[locale]}</dt><dd>{cleanDisplayText(row.value)}{entry&&path&&<EntryEdit entry={entry} locale={locale} scope={`field:${path}.${rows.indexOf(row)}.value`} compact/>}</dd>{row.note&&cleanDisplayText(row.note[locale])&&<small>{cleanDisplayText(row.note[locale])}</small>}</div></div>)}</dl>;}
export default function EntityDetails({profiles,locale,gameId,entry}:{profiles:EntityProfile[];locale:Locale;gameId?:string;entry?:Entry}){
 const catalog=useCatalog(),t=catalog.locale===locale?catalog.t:{...ui[locale],...catalog.settings?.ui?.[locale]};
 return <section className="entity-details"><div className="entity-details-heading"><ChartNoAxesCombined size={20}/><h3><UiText name="entityStats">{t.entityStats}</UiText></h3></div>{profiles.map((profile,pi)=><article data-character-content className="entity-profile" key={profile.id} style={textAppearanceStyle(profile.textStyle?.[locale])}>
  <header><div><small>{profile.category[locale]}</small><h4 style={textAppearanceStyle(profile.textStyle?.[locale],'title')}>{profile.name[locale]}{entry&&<EntryEdit entry={entry} locale={locale} scope={`field:entityDetails.${pi}.name`} compact/>}</h4></div></header>
  {!!profile.traits?.length&&<dl className="entity-traits">{profile.traits.map(trait=><div className={traitIcon(gameId,trait)?'has-native-icon':''} key={trait.id}>{traitIcon(gameId,trait)&&<span className={'trait-icon '+traitTone(gameId,trait)}><NativeIcon icon={traitIcon(gameId,trait)} alt=""/></span>}<div><dt>{trait.label[locale]}</dt><dd>{trait.value[locale]}</dd></div></div>)}</dl>}
  <CharacterSectionNav locale={locale} items={[{key:'stats',label:({ko:'능력치',en:'Stats',ja:'能力値',zh:'属性'})[locale]},...profile.groups.filter(g=>displaySection(g.title[locale],g.body[locale])).map((group,i)=>({key:'group-'+i,label:group.title[locale]}))]}/>
  <div data-character-section="stats"><Stats rows={profile.stats} locale={locale} gameId={gameId} entry={entry} path={`entityDetails.${pi}.stats`}/></div>
  {!!profile.materials?.length&&<EntityMaterials groups={profile.materials} locale={locale}/>}
  {cleanDisplayText(profile.basis[locale])&&!!profile.stats.length&&<details className="stat-assumptions"><summary>{{ko:'수치 기준',en:'Stat basis',ja:'数値の基準',zh:'数值基准'}[locale]}<ChevronDown size={14}/></summary><DetailCopy text={profile.basis[locale]} locale={locale} appearance={profile.textStyle?.[locale]}/></details>}
  {profile.groups.map((group,i)=>displaySection(group.title[locale],group.body[locale])&&<details data-character-section={'group-'+profile.groups.filter(g=>displaySection(g.title[locale],g.body[locale])).indexOf(group)} className="entity-skill" key={i} open={i===0}><summary><span style={textAppearanceStyle(group.textStyle?.[locale]||profile.textStyle?.[locale],'title')}>{group.title[locale]}</span><ChevronDown size={16}/></summary><DetailCopy text={group.body[locale]} locale={locale} appearance={group.textStyle?.[locale]||profile.textStyle?.[locale]}/>{entry&&<EntryEdit entry={entry} locale={locale} scope={`field:entityDetails.${pi}.groups.${i}`} compact/>}{!!group.rows?.length&&<Stats rows={group.rows} locale={locale} gameId={gameId} entry={entry} path={`entityDetails.${pi}.groups.${i}.rows`}/>}</details>)}
  {!!profile.notes?.some(note=>cleanDisplayText(note[locale]))&&<ul className="stat-notes">{profile.notes.map((note,i)=>cleanDisplayText(note[locale])&&<li key={i}>{cleanDisplayText(note[locale])}</li>)}</ul>}
 </article>)}</section>;
}
