import type {Locale} from '@/lib/types';
import type {WuwaCharacter} from '@/lib/wuwa-reference';
import {characterPath} from '@/lib/character-roster';
import {games} from '@/lib/games';
import {discoveryWords} from '@/lib/discovery';
import {WuwaCharacterFacts} from './wuwa-reference';

/** A full public detail document. The gallery keeps its lighter deferred dialog. */
export default function WuwaCharacterLanding({locale,character}:{locale:Locale;character:WuwaCharacter}){
 const game=games.find(g=>g.id==='wuwa')!;
 return <main className="document-reader character-landing wuwa-character-landing"><nav className="document-navigation"><a href={'/'+locale}>GAGETHER</a><a href={characterPath(locale,'wuwa')}>{discoveryWords[locale].characters}</a><a href={`/${locale}/games/wuwa`}>{game.name[locale]}</a></nav><header className="document-header"><p>{game.name[locale]} · {discoveryWords[locale].characters}</p><h1>{character.name[locale]}</h1></header><WuwaCharacterFacts character={character} locale={locale}/><nav className="document-languages">{(['ko','en','ja','zh'] as const).map(l=><a href={characterPath(l,'wuwa',character.id)} hrefLang={l} key={l}>{l.toUpperCase()}</a>)}</nav></main>;
}
