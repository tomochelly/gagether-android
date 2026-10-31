import type {RosterCharacter} from './character-roster';
import type {Locale} from './types';

type GradeSource=Pick<RosterCharacter,'rarity'|'rarityLabel'|'traits'>;
const starGames=new Set(['wuwa','genshin','hsr','bluearchive','umamusume','arknights','reverse1999','trickcal','stellasora','endfield']);
const letterGrades:Record<string,Record<number,string>>={nikke:{1:'R',2:'SR',3:'SSR'},zzz:{3:'A',4:'S'},nte:{4:'A',5:'S'}};
/** Source rarity numbers are sort keys, not a universal count of stars. */
export function characterRarity(gameId:string|undefined,c:GradeSource,locale:Locale='en'):{text:string;stars?:number}|undefined{
 const value=c.rarity,valid=typeof value==='number'&&Number.isInteger(value)&&value>0&&value<=10;
 if(gameId&&starGames.has(gameId))return valid?{text:'★'.repeat(value),stars:value}:undefined;
 if(gameId==='limbus')return valid&&value<=3?{text:'0'.repeat(value)}:undefined;
 if(gameId==='gfl2'){
  const rank=c.traits?.find(t=>t.id==='rank')?.value;
  const text=rank&&(rank[locale]||rank.en||rank.ko||rank.ja||rank.zh);
  if(text)return {text};
 }
 const label=c.rarityLabel?.trim();
 if(gameId&&letterGrades[gameId]){
  const grades=letterGrades[gameId];
  if(label&&Object.values(grades).includes(label))return {text:label};
  return valid&&grades[value]?{text:grades[value]}:undefined;
 }
 return label?{text:label}:undefined;
}
