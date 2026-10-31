import {PageReference} from './page-references';
import type {RosterCharacter} from '@/lib/character-roster';
import type {Locale} from '@/lib/types';
export default function CharacterAvailability({character,locale,detail=false}:{character:RosterCharacter;locale:Locale;detail?:boolean}){
 const status=character.availability;
 if(status?.status!=='announced')return null;
 const nativeSource=character.nameSources?.[locale],source=nativeSource?.kind==='official'?nativeSource.url:status.sourceUrl;
 return <><p className="roster-availability"><span>{({ko:'출시 예정',en:'Upcoming',ja:'実装予定',zh:'即将登场'})[locale]}</span></p>{detail&&<PageReference locale={locale}><a href={source} target="_blank" rel="noreferrer">{({ko:'공식 발표',en:'Official announcement',ja:'公式発表',zh:'官方公告'})[locale]} ↗</a></PageReference>}</>;
}
