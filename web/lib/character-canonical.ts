import {characterPath} from './character-roster';
import {effectiveRegion} from './presentation';
import {defaultRegionForLocale} from './visitor-locale';
import type {Game,Locale,Region} from './types';

export type CharacterIdentity={id:string;regions?:Region[]};

/** Match the character page's actual service, including unreleased regional forms. */
export function characterService(game:Game,character:CharacterIdentity,locale:Locale,requested?:string):Region{
 let service=effectiveRegion(game,game.regions.includes(requested as Region)?requested as Region:defaultRegionForLocale(locale));
 if(['umamusume','arknights'].includes(game.id)&&character.regions?.length&&!character.regions.includes(service)){
  service=(['jp','kr','global','cn']as const).find(region=>character.regions!.includes(region))!;
 }
 return service;
}

export function characterCanonicalPath(locale:Locale,game:Game,character:CharacterIdentity,service=characterService(game,character,locale)){
 return characterPath(locale,game.id,character.id)+(service!==effectiveRegion(game,defaultRegionForLocale(locale))?'?region='+service:'');
}
