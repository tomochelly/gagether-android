import type {Locale} from './types';
export type ConveneCurrency='KRW'|'JPY'|'USD';
export type ConveneCost={version:1;currency:ConveneCurrency;packPrice:number;packUnits:number};
export const CONVENE_COST_KEY='gagether.wuwa.convene.cost.v1';
const product='product/EB1238-PPSA24686_00-0478759117378519';
export const convenePrices={KRW:{packPrice:130900,packUnits:8080,sourceUrl:'https://store.playstation.com/ko-kr/'+product},JPY:{packPrice:13200,packUnits:8080,sourceUrl:'https://store.playstation.com/ja-jp/'+product},USD:{packPrice:99.99,packUnits:8080,sourceUrl:'https://store.playstation.com/en-us/'+product}} as const;
export const defaultConveneCost=(locale:Locale):ConveneCost=>{const currency=locale==='ko'?'KRW':locale==='ja'?'JPY':'USD';return {version:1,currency,packPrice:convenePrices[currency].packPrice,packUnits:convenePrices[currency].packUnits};};
export function validConveneCost(v:unknown):v is ConveneCost{
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 const x=v as ConveneCost;return x.version===1&&Object.hasOwn(convenePrices,x.currency)&&typeof x.packPrice==='number'&&Number.isFinite(x.packPrice)&&x.packPrice>0&&x.packPrice<=100_000_000&&Number.isSafeInteger(x.packUnits)&&x.packUnits>=1&&x.packUnits<=1_000_000;
}
export function parseConveneCost(raw:string|null,locale:Locale){
 if(raw===null)return {valid:true,value:defaultConveneCost(locale)};
 try{if(raw.length<=1000){const v=JSON.parse(raw);if(validConveneCost(v))return {valid:true,value:v};}}catch{}
 return {valid:false,value:defaultConveneCost(locale)};
}
/** A proportional equivalent, never a real transaction or minimum pack order. */
export function conveneCost(total:number,cost:ConveneCost){
 if(!Number.isSafeInteger(total)||total<0||total>1_000_000||!validConveneCost(cost))throw Error('Invalid convene cash estimate');
 const astrite=total*160;return {astrite,cash:astrite*cost.packPrice/cost.packUnits};
}
export const defaultCostBasis=(cost:ConveneCost)=>cost.packPrice===convenePrices[cost.currency].packPrice&&cost.packUnits===convenePrices[cost.currency].packUnits;
