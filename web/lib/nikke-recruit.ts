import type {Localized} from './types';
export type NikkeRank='R'|'SR'|'SSR';
export type RecruitNikke={id:string;name:Localized;rank:NikkeRank;image:string;manufacturer:string};
export type NikkeRecruitCatalog={poolId:string;featured:string;name:Localized;endsAt:string;characters:RecruitNikke[];sources:string[]};
export type RecruitBatch={id:string;characters:string[];free:boolean;complete:boolean};
export type RecruitPractice={version:1;poolId:string;revision:number;draws:number;mileage:number;owned:Record<string,number>;batches:RecruitBatch[]};
export const NIKKE_PRACTICE_KEY='gagether:nikke:recruit:v1';
export const NIKKE_DENOMINATOR=12600;
const UINT32=0x1_0000_0000;
export function recruitInteger(size:number,word=()=>crypto.getRandomValues(new Uint32Array(1))[0]){
 if(!Number.isSafeInteger(size)||size<1||size>UINT32)throw Error('Invalid sample size');
 const limit=Math.floor(UINT32/size)*size;
 for(let i=0;i<128;i++){const n=word();if(!Number.isInteger(n)||n<0||n>=UINT32)throw Error('Invalid random word');if(n<limit)return n%size;}
 throw Error('Random source unavailable');
}
export function recruitWeight(c:RecruitNikke,featured:string){return c.id===featured?126:c.rank==='SSR'?3:c.rank==='SR'?602:742;}
export function validateRecruitCatalog(c:NikkeRecruitCatalog){
 if(new Set(c.characters.map(n=>n.id)).size!==145||c.characters.length!==145||c.characters.filter(n=>n.rank==='SSR').length!==127||c.characters.filter(n=>n.rank==='SR').length!==9||c.characters.filter(n=>n.rank==='R').length!==9||!c.characters.some(n=>n.id===c.featured&&n.rank==='SSR')||c.characters.some(n=>!n.image)||c.characters.reduce((s,n)=>s+recruitWeight(n,c.featured),0)!==NIKKE_DENOMINATOR)throw Error('Incomplete recruitment pool');
 return c;
}
export function recruitTicket(c:NikkeRecruitCatalog,ticket:number){
 if(!Number.isInteger(ticket)||ticket<0||ticket>=NIKKE_DENOMINATOR)throw Error('Invalid ticket');
 for(const n of c.characters){const weight=recruitWeight(n,c.featured);if(ticket<weight)return n;ticket-=weight;}
 throw Error('Incomplete recruitment pool');
}
export const emptyRecruitPractice=(poolId:string):RecruitPractice=>({version:1,poolId,revision:0,draws:0,mileage:0,owned:{},batches:[]});
export function parseRecruitPractice(raw:string|null,c:NikkeRecruitCatalog):RecruitPractice{
 if(raw===null)return emptyRecruitPractice(c.poolId);
 const s=JSON.parse(raw) as RecruitPractice,ids=new Set(c.characters.map(n=>n.id));
 const integer=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0;
 if(s.version!==1||s.poolId!==c.poolId||!integer(s.revision)||!integer(s.draws)||!integer(s.mileage)||!s.owned||typeof s.owned!=='object'||Array.isArray(s.owned)||Object.entries(s.owned).some(([id,n])=>!ids.has(id)||!integer(n))||!Array.isArray(s.batches)||s.batches.length>50||s.batches.some(b=>!b||typeof b.id!=='string'||b.id.length>100||!Array.isArray(b.characters)||![1,10].includes(b.characters.length)||b.characters.some(id=>!ids.has(id))||typeof b.free!=='boolean'||typeof b.complete!=='boolean')||new Set(s.batches.map(b=>b.id)).size!==s.batches.length)throw Error('Saved practice is unreadable');
 return s;
}
export function commitRecruitPractice(s:RecruitPractice,c:NikkeRecruitCatalog,id:string,count:1|10,free=false,word?:()=>number){
 if(!/^[\w-]{1,100}$/.test(id)||s.poolId!==c.poolId)throw Error('Invalid draw identity');
 if(s.batches.some(b=>b.id===id))return s;
 if(s.batches.at(-1)&&!s.batches.at(-1)!.complete)throw Error('Finish the pending recruitment');
 if(count!==1&&count!==10)throw Error('Recruit once or ten times');
 const characters=Array.from({length:count},()=>recruitTicket(c,recruitInteger(NIKKE_DENOMINATOR,word)).id),owned={...s.owned};for(const nikke of characters)owned[nikke]=(owned[nikke]||0)+1;
 return {...s,revision:s.revision+1,draws:s.draws+count,mileage:s.mileage+(free?0:count),owned,batches:[...s.batches,{id,characters,free,complete:false}].slice(-50)};
}
export function completeRecruitPractice(s:RecruitPractice,id:string){const batch=s.batches.find(b=>b.id===id);return !batch||batch.complete?s:{...s,revision:s.revision+1,batches:s.batches.map(b=>b.id===id?{...b,complete:true}:b)};}
