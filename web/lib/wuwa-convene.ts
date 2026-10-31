import type {Localized} from './types';

export type ConveneItem={id:string;kind:'character'|'weapon';rarity:3|4|5;name:Localized;image?:string;icon?:string;cardImage?:string;width?:number;height?:number;focus?:{x:number;y:number};element?:Localized;type?:Localized;sourceUrl:string};
export type ConveneBanner={id:string;featuredId:string;rateUpIds:string[];startAt:string;endAt:string;sourceUrl:string};
export type ConveneCatalog={version:1;checkedAt:string;banners:ConveneBanner[];items:ConveneItem[];standardFiveIds:string[];fourIds:string[];threeIds:string[];rulesSource:string;poolSources:string[];unavailable?:boolean};
export type ConveneResult={number:number;bannerId:string;id:string;rarity:3|4|5;kind:'character'|'weapon';name:Localized;featured:boolean;isNew:boolean;copies:number;pity:number;at:string};
export type ConveneState={version:1;revision:number;total:number;pity5:number;pity4:number;guaranteed5:boolean;guaranteed4:boolean;owned:Record<string,number>;history:ConveneResult[]};
export const CONVENE_KEY='gagether.wuwa.convene.v1';
export const CONVENE_HISTORY=200;
export const emptyConveneState=():ConveneState=>({version:1,revision:0,total:0,pity5:0,pity4:0,guaranteed5:false,guaranteed4:false,owned:{},history:[]});
const integer=(v:unknown,max:number)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
const identity=(s:unknown):s is string=>typeof s==='string'&&/^[a-zA-Z0-9_:-]{1,180}$/.test(s)&&!['__proto__','constructor','prototype'].includes(s);
export function validateConveneState(value:unknown):value is ConveneState{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as ConveneState;
 if(v.version!==1||!integer(v.revision,10_000_000)||!integer(v.total,1_000_000)||!integer(v.pity5,79)||!integer(v.pity4,9)||typeof v.guaranteed5!=='boolean'||typeof v.guaranteed4!=='boolean'||!v.owned||typeof v.owned!=='object'||Array.isArray(v.owned)||Object.keys(v.owned).length>2000||!Array.isArray(v.history)||v.history.length>CONVENE_HISTORY)return false;
 if(Object.entries(v.owned).some(([id,n])=>!identity(id)||!integer(n,1_000_000)||!n))return false;
 return v.history.every(r=>r&&integer(r.number,v.total)&&r.number>0&&identity(r.id)&&identity(r.bannerId)&&[3,4,5].includes(r.rarity)&&['character','weapon'].includes(r.kind)&&typeof r.featured==='boolean'&&typeof r.isNew==='boolean'&&integer(r.copies,1_000_000)&&r.copies>0&&integer(r.pity,80)&&r.pity>0&&typeof r.at==='string'&&Number.isFinite(Date.parse(r.at))&&r.name&&['ko','en','ja','zh'].every(l=>typeof r.name[l as keyof Localized]==='string'&&r.name[l as keyof Localized].length<250));
}
export function parseConveneState(raw:string|null):{state:ConveneState;valid:boolean}{
 if(raw===null)return {state:emptyConveneState(),valid:true};
 try{if(raw.length>350_000)throw Error();const state=JSON.parse(raw);if(validateConveneState(state))return {state,valid:true};}catch{}
 return {state:emptyConveneState(),valid:false};
}
export function secureConveneRandom(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;}
const sample=(ids:string[],random:()=>number)=>{if(!ids.length)throw Error('Empty convene pool');const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Invalid random input');return ids[Math.floor(n*ids.length)];};
export function activeConveneBanners(catalog:ConveneCatalog,now:number){return catalog.banners.filter(b=>Number.isFinite(Date.parse(b.startAt))&&Date.parse(b.startAt)<=now&&Date.parse(b.endAt)>now);}
// User-supplied soft-pity table. These detailed steps are a simulation model,
// separate from the published0.8% base and80-pull maximum guarantee.
export function conveneFiveStarRate(consecutiveMisses:number){
 if(!integer(consecutiveMisses,79))throw Error('Invalid pity');
 const next=consecutiveMisses+1;
 return next<=65?.008:[48,88,128,168,208,288,368,448,528,608,708,808,908,1000,1000][next-66]/1000;
}
export function drawConvene(previous:ConveneState,catalog:ConveneCatalog,bannerId:string,count:1|10,now=Date.now(),random=secureConveneRandom){
 if(!validateConveneState(previous)||![1,10].includes(count)||previous.total+count>1_000_000)throw Error('Invalid simulator state');
 const banner=activeConveneBanners(catalog,now).find(b=>b.id===bannerId);if(!banner)throw Error('This convene is no longer active');
 const uniform=()=>{const value=random();if(!Number.isFinite(value)||value<0||value>=1)throw Error('Invalid random input');return value;};
 const items=new Map(catalog.items.map(i=>[i.id,i]));
 const check=(ids:string[],rarity:number)=>ids.length>0&&new Set(ids).size===ids.length&&ids.every(id=>items.get(id)?.rarity===rarity);
 if(!check(catalog.standardFiveIds,5)||!check(catalog.fourIds,4)||!check(catalog.threeIds,3)||!check(banner.rateUpIds,4)||items.get(banner.featuredId)?.rarity!==5||catalog.standardFiveIds.includes(banner.featuredId)||banner.rateUpIds.some(id=>!catalog.fourIds.includes(id)))throw Error('Incomplete source-backed pool');
 const offFour=catalog.fourIds.filter(id=>!banner.rateUpIds.includes(id));if(!offFour.length)throw Error('Missing non-featured pool');
 const state={...previous,owned:{...previous.owned},history:[...previous.history]},results:ConveneResult[]=[];
 for(let i=0;i<count;i++){
  const roll=uniform();if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('Invalid random input');
  const pity=state.pity5+1,fiveRate=conveneFiveStarRate(state.pity5),rarity=roll<fiveRate?5:state.pity4===9||roll<Math.min(1,fiveRate+.06)?4:3;
  let id:string,featured=false;
  if(rarity===5){featured=state.guaranteed5||uniform()<.5;id=featured?banner.featuredId:sample(catalog.standardFiveIds,uniform);state.guaranteed5=!featured;state.pity5=0;state.pity4=0;}
  else if(rarity===4){featured=state.guaranteed4||uniform()<.5;id=sample(featured?banner.rateUpIds:offFour,uniform);state.guaranteed4=!featured;state.pity5++;state.pity4=0;}
  else{id=sample(catalog.threeIds,uniform);state.pity5++;state.pity4++;}
  const item=items.get(id)!;const copies=(state.owned[id]||0)+1;state.owned[id]=copies;state.total++;
  results.push({number:state.total,bannerId:banner.id,id,rarity,kind:item.kind,name:{...item.name},featured,isNew:copies===1,copies,pity,at:new Date(now).toISOString()});
 }
 state.revision++;state.history=[...results.slice().reverse(),...state.history].slice(0,CONVENE_HISTORY);
 return {state,results};
}
export function conveneRewards(results:ConveneResult[]){return results.reduce((r,item)=>({afterglow:r.afterglow+(item.rarity===5?((item.kind==='character'&&item.copies>=8?40:15)+(item.kind==='character'&&!item.featured?30:0)):item.rarity===4?(item.kind==='character'&&item.copies>=8?8:3):0),oscillated:r.oscillated+(item.rarity===3?15:0)}),{afterglow:0,oscillated:0});}
