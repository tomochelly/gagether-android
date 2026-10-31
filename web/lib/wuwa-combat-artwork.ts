import repairs from '../content/wuwa-combat-image-repairs.json' with {type:'json'};
import artwork from '../content/wuwa-combat-artwork.json' with {type:'json'};
import type {WuwaEnemy} from './wuwa-reference';
const exact=new Map(artwork.exact.map(a=>[a.source,a.image]));
const repairsByIdentity=new Map(repairs.alternatives.map(a=>[a.enemyId+'|'+a.source,a]));
const alternatives=new Map(artwork.echoAlternatives.map(a=>[a.enemyId+'|'+a.source,a]));
/** Resource-path matches first; a creature's Echo image needs its full identity. */
export function combatIcon(source?:string){return source?exact.get(source)||source:undefined;}
export function combatEnemyImage(enemy:WuwaEnemy){
 if(enemy.icon&&exact.has(enemy.icon))return exact.get(enemy.icon);
 const repair=repairsByIdentity.get(enemy.id+'|'+enemy.icon);
 if(repair&&(['ko','en','ja','zh']as const).every(l=>repair.name[l]===enemy.name[l]))return '/api/wuwa/combat-images/'+repair.hash;
 const alternative=alternatives.get(enemy.id+'|'+enemy.icon);
 return alternative&&(['ko','en','ja','zh']as const).every(l=>alternative.name[l]===enemy.name[l])?alternative.image:enemy.icon;
}
