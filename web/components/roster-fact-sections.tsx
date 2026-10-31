import {rosterCopy,type RosterCharacter} from '@/lib/character-roster';
import type {Locale} from '@/lib/types';
import {RosterFactIcon} from './roster-stat-details';

/** Native Endfield talent/potential/base prose stays complete behind its label. */
export default function RosterFactSections({sections,locale,gameId}:{sections:NonNullable<RosterCharacter['sections']>;locale:Locale;gameId?:string}){
 const original={ko:'원문',en:'Original',ja:'原文',zh:'原文'}[locale];
 return <>{sections.map(section=>{
  const title=rosterCopy(section.title,locale),body=rosterCopy(section.body,locale),native=gameId==='endfield'&&section.id.startsWith('endfield-detail-')&&section.id!=='endfield-detail-attribute-priority';
  if(native){const first=body.includes('\n')?body.split('\n')[0]:'';return <details className="roster-fact-section roster-fact-disclosure" key={section.id}><summary><RosterFactIcon src={section.icon}/><span><strong>{title}</strong>{first&&<small>{first}</small>}</span></summary><p>{body}</p>{!section.body[locale]&&<small>{original}</small>}</details>;}
  return <section className="roster-fact-section" key={section.id}><h3><RosterFactIcon src={section.icon}/>{title}</h3><p>{body}</p>{!section.body[locale]&&<small>{original}</small>}</section>;
 })}</>;
}
