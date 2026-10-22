import type {Entry,Locale,Localized} from './types';

export interface PickupEstimate {
 method:'cycle'|'community';scope:'banner'|'version';startDate:string;alternativeStartDates?:string[];
 anchorDate?:string;cycleDays?:number;basis:Localized;sourceUrls:string[];verifiedAt:string;
}
// Arithmetic uses calendar dates only. Never return a synthesized gameplay clock.
export function cycleStartDate(anchorDate:string,cycleDays:number){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(anchorDate)||!Number.isInteger(cycleDays)||cycleDays<1||cycleDays>366)return undefined;
 const date=new Date(anchorDate+'T12:00:00Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==anchorDate)return undefined;
 date.setUTCDate(date.getUTCDate()+cycleDays);return date.toISOString().slice(0,10);
}
export const isForecast=(entry:Entry)=>entry.pickupArchive?.status==='forecast';
export const pickupEstimate=(entry:Entry)=>isForecast(entry)?entry.pickupArchive?.estimate:undefined;
export const estimatedStart=(entry:Entry)=>pickupEstimate(entry)?.startDate;
export const estimateText={
 ko:{estimated:'예상',version:'버전 시작 예상 · 캐릭터 배치 미확정',banner:'픽업 시작 예상',cycle:'업데이트 주기 기준 예상',community:'커뮤니티 자료 기준 예상',or:' 또는 ',unknown:'시작일 미정'},
 en:{estimated:'estimated',version:'Estimated version start · character phase unconfirmed',banner:'Estimated banner start',cycle:'Estimated from the update cycle',community:'Estimated from community sources',or:' or ',unknown:'Start date unannounced'},
 ja:{estimated:'予想',version:'バージョン開始予想・登場期未確定',banner:'ガチャ開始予想',cycle:'更新周期に基づく予想',community:'コミュニティ資料に基づく予想',or:' または ',unknown:'開始日未発表'},
 zh:{estimated:'预测',version:'版本开始预测 · 角色分期未确定',banner:'卡池开始预测',cycle:'根据更新周期预测',community:'根据社区资料预测',or:' 或 ',unknown:'开始日期未公布'},
};
export function pickupStartLabel(entry:Entry,locale:Locale,start?:string){
 const estimate=pickupEstimate(entry),l=estimateText[locale];
 const dates=start?[start]:estimate?[estimate.startDate,...estimate.alternativeStartDates||[]]:[];
 return dates.length?dates.map(date=>date.replaceAll('-','.')).join(l.or)+(isForecast(entry)?' ('+l.estimated+')':''):l.unknown;
}
