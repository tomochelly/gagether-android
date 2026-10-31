import type {Locale} from './types';

export function displayZone(locale:Locale,visitorZone='UTC'){
 if(locale==='ko')return 'Asia/Seoul';
 if(locale==='ja')return 'Asia/Tokyo';
 if(locale==='zh')return 'Asia/Shanghai';
 try{new Intl.DateTimeFormat('en',{timeZone:visitorZone});return visitorZone;}catch{return 'UTC';}
}
const formatters=new Map<string,Intl.DateTimeFormat>();
export function dateInZone(value:string|number,zone:string){
 if(!formatters.has(zone))formatters.set(zone,new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}));
 const parts=formatters.get(zone)!.formatToParts(new Date(value));
 const get=(type:string)=>parts.find(p=>p.type===type)!.value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
