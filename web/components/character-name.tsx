import {characterRarity} from '@/lib/character-rarity';
import type {RosterCharacter} from '@/lib/character-roster';
import type {Locale} from '@/lib/types';
/** Every codex keeps its native grade small and beside the character name. */
export default function CharacterName({name,gameId,rarity,rarityLabel,traits,locale='en',detail=false}:{name:string;gameId?:string;rarity?:number;rarityLabel?:string;traits?:RosterCharacter['traits'];locale?:Locale;detail?:boolean}){
 const Tag=detail?'h2':'strong',grade=characterRarity(gameId,{rarity,rarityLabel,traits},locale);
 return <Tag className="roster-name-row"><span className="roster-name-text">{name}</span>{grade&&<span className={'roster-name-grade'+(grade.stars?' roster-name-stars':'')} role={grade.stars?'img':undefined} aria-label={grade.stars?grade.stars+' ★':undefined}>{grade.text}</span>}</Tag>;
}
