import type {Locale,Region} from '@/lib/types';
import type {CharacterRoster,RosterCharacter} from '@/lib/character-roster';
import {characterPath,rosterCopy} from '@/lib/character-roster';
import {games} from '@/lib/games';
import {discoveryWords} from '@/lib/discovery';
import CharacterRosterPanel,{CharacterFacts} from './character-roster';
export default function CharacterLanding({gameId,locale,region,data,character}:{gameId:string;locale:Locale;region:Region;data:CharacterRoster;character?:RosterCharacter}){
 const game=games.find(g=>g.id===gameId)!,title=character?rosterCopy(character.name,locale):discoveryWords[locale].characters;
 return <main className="document-reader character-landing"><nav className="document-navigation"><a href={'/'+locale}>GAGETHER</a><a href={character?characterPath(locale,gameId)+'?region='+region:`/${locale}/games/${gameId}?region=${region}`}>{character?discoveryWords[locale].characters:discoveryWords[locale].back}</a></nav>{character?<><header className="document-header"><p>{game.name[locale]} · {discoveryWords[locale].characters}</p><h1>{title}</h1></header><CharacterFacts character={character} locale={locale} service={region}/></>:<CharacterRosterPanel gameId={gameId} locale={locale} region={region} initialData={data}/>}<nav className="document-languages">{(['ko','en','ja','zh'] as const).map(l=><a href={characterPath(l,gameId,character?.id)+'?region='+region} hrefLang={l} key={l}>{l.toUpperCase()}</a>)}</nav></main>;
}
