import type {Localized} from './types';
const normalize=(s:string)=>s.normalize('NFKC').trim().replace(/\s+/g,' ').replace(/\s*([()])\s*/g,'$1').toLowerCase();
export function samePickupName(a:Localized,b:Localized){
 const shared=(['ko','en','ja','zh'] as const).filter(l=>a[l]?.trim()&&b[l]?.trim());
 return shared.length>0&&shared.every(l=>normalize(a[l])===normalize(b[l]));
}
