import type {Locale,Region} from '@/lib/types';
import type {CharacterRoster,RosterCharacter} from '@/lib/character-roster';
import {characterPath,rosterCopy} from '@/lib/character-roster';
import {games} from '@/lib/games';
import {discoveryWords} from '@/lib/discovery';
import CharacterRosterPanel,{CharacterFacts} from './character-roster';
export default function CharacterLanding({gameId,locale,region,data,character,initialRead}:{gameId:string;locale:Locale;region:Region;data:CharacterRoster;character?:RosterCharacter;initialRead?:import('./character-roster').RosterInitialRead}){
 const services={ko:{jp:'일본 서버',kr:'한국 서버',global:'글로벌 서버',cn:'중국 서버'},en:{jp:'Japan server',kr:'Korea server',global:'Global server',cn:'China server'},ja:{jp:'日本版',kr:'韓国版',global:'グローバル版',cn:'中国版'},zh:{jp:'日服',kr:'韩服',global:'国际服',cn:'国服'}};
 const game=games.find(g=>g.id===gameId)!,title=character?rosterCopy(character.name,locale):discoveryWords[locale].characters;
 return <main className="document-reader character-landing"><nav className="document-navigation"><a href={'/'+locale}>GAGETHER</a><a href={character?characterPath(locale,gameId)+'?region='+region:`/${locale}/games/${gameId}?region=${region}`}>{character?discoveryWords[locale].characters:discoveryWords[locale].back}</a></nav>{character?<><header className="document-header"><p>{game.name[locale]} · {discoveryWords[locale].characters}{gameId==='umamusume'?' · '+services[locale][region]:''}</p><h1>{title}</h1></header><CharacterFacts character={character} locale={locale} service={region} gameId={gameId}/></>:<CharacterRosterPanel gameId={gameId} locale={locale} region={region} initialData={data} initialRead={initialRead}/>}<nav className="document-languages">{(['ko','en','ja','zh'] as const).map(l=><a href={characterPath(l,gameId,character?.id)+'?region='+region} hrefLang={l} key={l}>{l.toUpperCase()}</a>)}</nav></main>;
}
