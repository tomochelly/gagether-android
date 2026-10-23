import type {Entry,EntityArtwork,Localized} from './types';
import {featuredMembers} from './presentation';

// Reviewed rotation links, keyed by immutable entry IDs (never translated titles).
// New rotations should store signatureWeapons with their own provenance via /api/sync.
// Member selectors are exact names, not positions, so combined/rate-up pools stay safe.
const reviewed:Record<string,{entryId:string;memberName?:string}[]>={
 'endfield-si':[{entryId:'endfield-jade-vessel'}],
 'endfield-argent-flow':[{entryId:'endfield-lunar-calling'}],
 'endfield-tangtang':[{entryId:'endfield-brigand'}],
 'wuwa-hsin':[{entryId:'wuwa-blooming-jadehaven'}],
 'wuwa-chisa':[{entryId:'wuwa-kumokiri'}],
 'wuwa-iuno':[{entryId:'wuwa-moongazer'}],
 'nte-blackbird':[{entryId:'nte-crime-punishment'}],
 'nte-lacrimosa':[{entryId:'nte-last-rose'}],
 'zzz-32-roxy':[{entryId:'zzz-32-crimson-moon'}],
 'zzz-32-promeia':[{entryId:'zzz-32-frostfall'}],
 'hsr-46-pearl':[{entryId:'hsr-46-colors-for-tomorrow'}],
 'hsr-46-evanescia':[{entryId:'hsr-46-flowers-bloom-again'}],
 'hist-wuwa-global-undated-character-839ce2d58c16':[{entryId:'wuwa-3-7-phase-2-unspoken-rue'}],
 'hist-wuwa-global-20261022-character-lynae':[{entryId:'wuwa-3-7-phase-2-spectrum-blaster'}],
 'hist-wuwa-global-20261022-character-lucilla':[{entryId:'wuwa-3-7-phase-2-freeze-frame'}],
 'gfl2-kr-mityl-featured':[{entryId:'gfl2-kr-20261008-squirrel-nova'}],
 'gfl2-kr-20261008-cheyanne':[{entryId:'gfl2-kr-20261008-nightwalker-cardamom'}],
 'gfl2-kr-20261008-liushih':[{entryId:'gfl2-kr-20261008-transience'}],
 'gfl2-jp-mityl-featured':[{entryId:'gfl2-jp-20261008-squirrel-nova'}],
 'gfl2-jp-20261008-cheyanne':[{entryId:'gfl2-jp-20261008-nightwalker-cardamom'}],
 'gfl2-jp-20261008-liushih':[{entryId:'gfl2-jp-20261008-transience'}],
 'gfl2-haoplay-mityl-featured':[{entryId:'gfl2-global-20261008-squirrel-nova'}],
 'gfl2-global-20261008-cheyanne':[{entryId:'gfl2-global-20261008-nightwalker-cardamom'}],
 'gfl2-global-20261008-liushih':[{entryId:'gfl2-global-20261008-transience'}],
 'gfl2-cn-20261013-igla':[{entryId:'gfl2-cn-20261013-swan'}],
 'gfl2-cn-20261013-eagletta':[{entryId:'gfl2-cn-20261013-silverwings'}],
 'gfl2-cn-20261013-sextans':[{entryId:'gfl2-cn-20261013-rose'}],
 'gfl2-cn-20261013-ots14':[{entryId:'gfl2-cn-20261013-capitoline'}],
 'genshin-71-skirk':[{entryId:'genshin-71-weapon',memberName:'Azurelight'}],
 'genshin-71-escoffier':[{entryId:'genshin-71-weapon',memberName:'Symphonist of Scents'}],
};
export const reviewedSignatureRefs=(character:Entry)=>character.signatureWeapons??reviewed[character.id]??[];
export interface WeaponLink {entry:Entry;art:EntityArtwork;name:Localized;key:string}
export function signatureWeapons(character:Entry,entries:Entry[]):WeaponLink[]{
 if(character.kind!=='pickup'||character.poolType==='support'||character.poolType==='weapon'||character.selectionCount||character.pickupArchive?.status==='past')return [];
 const refs=reviewedSignatureRefs(character);
 const result:WeaponLink[]=[];
 for(const ref of refs){
  const weapon=entries.find(e=>e.id===ref.entryId&&e.gameId===character.gameId&&e.region===character.region&&e.kind==='weapon'&&!e.pickupArchive&&!e.hidden);
  if(!weapon)continue;
  const members=featuredMembers(weapon)||[];
  if(weapon.pickupMembers?.length&&!members.length)continue;
  const member=ref.memberName?members.find(m=>Object.values(m.name).includes(ref.memberName!)):members.length===1?members[0]:undefined;
  // A multi-weapon pool needs an exact selector; never substitute a neighbouring member.
  if(ref.memberName&&!member||members.length>1&&!member)continue;
  const key=weapon.id+':'+(ref.memberName||'');
  if(!result.some(link=>link.key===key))result.push({entry:weapon,art:member||weapon,name:member?.name||weapon.title,key});
 }
 return result;
}
export const weaponUi={
 ko:{label:'전용 무기',open:'무기 상세 보기',show:'무기 목록 펼치기',hide:'무기 목록 접기'},
 en:{label:'Signature weapon',open:'View weapon details',show:'Show weapon banners',hide:'Hide weapon banners'},
 ja:{label:'モチーフ武器',open:'武器の詳細を見る',show:'武器一覧を開く',hide:'武器一覧を閉じる'},
 zh:{label:'专属武器',open:'查看武器详情',show:'展开武器列表',hide:'收起武器列表'},
};
