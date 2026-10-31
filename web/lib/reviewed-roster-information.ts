import reviewed from '../content/reviewed-roster-information.json' with {type:'json'};
import type {RosterCharacter} from './character-roster';
import type {Locale,Region} from './types';

type Art=NonNullable<RosterCharacter['image']>;
const equal=(a:unknown,b:unknown):boolean=>{
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 const left=Object.keys(a),right=Object.keys(b);
 return left.length===right.length&&left.every(k=>Object.hasOwn(b,k)&&equal((a as Record<string,unknown>)[k],(b as Record<string,unknown>)[k]));
};

/** Public read projection only; collected originals and owner values stay intact. */
export function reviewedRosterInformation(gameId:string,c:RosterCharacter):RosterCharacter{
 const rule=reviewed.bluearchive;
 if(gameId!=='bluearchive'||c.id!==rule.id||c.sourceId!==rule.sourceId||c.sourceUrl!==rule.sourceUrl||c.name.ja!==rule.japaneseName||!equal(c.regions,rule.regions))return c;
 let next=c;
 if(c.name.zh===rule.replaceChineseName.from&&!c.nameSources?.zh){
  next={...next,name:{...c.name,zh:rule.replaceChineseName.to},nameSources:{...c.nameSources,zh:{url:rule.replaceChineseName.sourceUrl,kind:'community'}}};
 }
 // An existing primary or alternative is authoritative, including owner additions.
 if(!c.image&&!c.images?.length)next={...next,image:structuredClone(rule.image) as Art};
 return next;
}

/** A single reviewed original is available when this shared-service locale has
 * no eligible localized illustration. Never relabel the poster as neutral/Chinese. */
export function reviewedRosterOriginalFallback(c:RosterCharacter,imageLocale:Locale,service?:Region):Art|undefined{
 const rule=reviewed.limbus;
 if(imageLocale!==rule.fallbackLocale||service&&service!==rule.service||c.id!==rule.id||c.sourceId!==rule.sourceId||c.sourceUrl!==rule.sourceUrl||!equal(c.image,rule.original))return undefined;
 return c.image;
}
