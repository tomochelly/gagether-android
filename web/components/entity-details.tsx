'use client';
import {ArrowUpRight,ChartNoAxesCombined,ChevronDown,ShieldCheck,MessageSquare} from 'lucide-react';
import type {EntityProfile,Locale,StatRow} from '@/lib/types';
import {localeCode} from '@/lib/i18n';
import {useCatalog} from './catalog-context';
import {NativeIcon} from './reward-display';
import {studioText} from '@/lib/studio-i18n';

function Stats({rows,locale}:{rows:StatRow[];locale:Locale}){return <dl className="entity-stat-grid">{rows.map((row,i)=><div key={i}><dt>{row.label[locale]}</dt><dd>{row.value}</dd>{row.note&&<small>{row.note[locale]}</small>}</div>)}</dl>;}
export default function EntityDetails({profiles,locale}:{profiles:EntityProfile[];locale:Locale}){
 const {t}=useCatalog();const sourceLabel=(kind:string)=>kind==='official'?t.officialNews:kind==='video'?t.videoInfo:t.communityInfo;
 return <section className="entity-details"><div className="entity-details-heading"><ChartNoAxesCombined size={20}/><h3>{t.entityStats}</h3><span>{t.statsSummary}</span></div>{profiles.map(profile=><article className="entity-profile" key={profile.id}>
  <header><div><small>{profile.category[locale]}</small><h4>{profile.name[locale]}</h4>{profile.translatedLocales?.includes(locale)&&!profile.officialLocales?.includes(locale)&&<small className="localization-label">{locale==='zh'&&profile.name.zh===profile.name.ja?t.localizationPending:t.translatedTitle}</small>}</div><span className={'stat-source '+profile.statSourceKind}>{profile.statSourceKind==='official'?<ShieldCheck size={12}/>:<MessageSquare size={12}/>} {sourceLabel(profile.statSourceKind)}</span></header>{!!profile.traits?.length&&<dl className="entity-traits">{profile.traits.map(trait=><div key={trait.id}><NativeIcon icon={trait.icon} alt=""/><div><dt>{trait.label[locale]}</dt><dd>{trait.value[locale]}{trait.translatedLocales?.includes(locale)&&!trait.officialLocales?.includes(locale)&&<small>{studioText[locale].translated}</small>}</dd></div></div>)}</dl>}<p className="stat-basis">{profile.basis[locale]}</p><Stats rows={profile.stats} locale={locale}/>
  {profile.groups.map((group,i)=><details className="entity-skill" key={i} open={i===0}><summary><span>{group.title[locale]}<small className={'stat-source '+group.sourceKind}>{sourceLabel(group.sourceKind)}</small></span><ChevronDown size={16}/></summary><p>{group.body[locale]}</p>{!!group.rows?.length&&<Stats rows={group.rows} locale={locale}/>}</details>)}
  {!!profile.notes?.length&&<ul className="stat-notes">{profile.notes.map((note,i)=><li key={i}>{note[locale]}</li>)}</ul>}

 </article>)}</section>;
}
