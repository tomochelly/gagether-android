import catalog from '../content/zzz-combat-catalog.json' with {type:'json'};
import manifest from '../content/zzz-signature-weapons.json' with {type:'json'};
import type {RosterCharacter} from './character-roster';
const weapons=new Map(catalog.weapons.map(w=>[w.id,w]));
const title={ko:'전용 W-엔진',en:'Signature W-Engine',ja:'モチーフ音動機',zh:'专属音擎'};
export function withZzzSignatureWeapon(c:RosterCharacter):RosterCharacter{
 if(c.availability?.status==='announced'||c.sections?.some(s=>s.id==='zzz-signature-weapon'))return c;
 const w=weapons.get((manifest.characters as Record<string,string>)[c.id]);if(!w)return c;
 return {...c,sections:[...c.sections||[],{id:'zzz-signature-weapon',title,body:w.name,icon:w.icon}],detailSources:[...c.detailSources||[],...[manifest.sourceUrl,manifest.weaponsSourceUrl].filter(url=>!c.detailSources?.some(s=>s.url===url)).map(url=>({url,kind:'community' as const}))]};
}
