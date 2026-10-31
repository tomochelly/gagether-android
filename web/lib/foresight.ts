import {z} from 'zod';
import type {Locale,Region} from './types';
export const foresightGames=['bluearchive','arknights','reverse1999'] as const;
export const hasForesight=(gameId:string)=>foresightGames.some(id=>id===gameId);
export const foresightTabs={ko:'미래시',en:'Foresight',ja:'先行情報',zh:'前瞻'};
export const foresightPath=(locale:Locale,gameId:string)=>`/${locale}/games/${encodeURIComponent(gameId)}/foresight`;
const copy=z.object({ko:z.string().min(1),en:z.string().min(1),ja:z.string().min(1),zh:z.string().min(1)}).strict();
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v);
const region=z.enum(['kr','jp','global','cn']);
const url=z.string().url().refine(v=>{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;});
export const foresightSourceSchema=z.object({url,title:z.string(),kind:z.enum(['official','community']),locale:z.string(),access:z.enum(['body','feed','search-index']),publishedAt:z.string().datetime({offset:true}).nullable().optional(),bodyHash:z.string().regex(/^[a-f0-9]{64}$/).optional()}).strict();
const pair=z.object({id:z.string(),label:copy,leadingDate:date,targetDate:date,leadingRegion:region,targetRegion:region,sources:z.array(foresightSourceSchema).min(2)}).strict();
const image=z.object({url,width:z.number().int().positive().optional(),height:z.number().int().positive().optional(),locale:z.enum(['neutral','ko','en','ja','zh'])}).strict();
const timing=z.object({regions:z.array(region).min(1),kind:z.enum(['confirmed','community','lag','sequence']),startDate:date.optional(),endDate:date.optional(),precision:z.enum(['day','range','month']).optional(),scope:copy.optional(),anchorIds:z.array(z.string()).optional(),sources:z.array(foresightSourceSchema),note:copy.optional()}).strict();
export const foresightItemSchema=z.object({id:z.string(),title:copy,summary:copy,type:z.enum(['release','rerun','event','collaboration']),members:z.array(z.object({id:z.string().optional(),name:copy,nameReferences:z.array(z.enum(['ko','en','ja','zh'])).optional(),image:image.optional()}).strict()),leading:z.object({startDate:date,endDate:date.optional(),sources:z.array(foresightSourceSchema).min(1)}).strict(),targets:z.array(timing).min(1)}).strict();
export const foresightSchema=z.object({gameId:z.enum(foresightGames),checkedAt:z.union([z.string().datetime({offset:true}),date]),leadingRegion:region,targetRegions:z.array(region).min(1),overview:copy,caution:copy,pairs:z.array(pair),items:z.array(foresightItemSchema)}).strict().superRefine((data,ctx)=>{
 if(new Set(data.items.map(x=>x.id)).size!==data.items.length)ctx.addIssue({code:'custom',message:'Duplicate foresight identity'});
 for(const [i,item]of data.items.entries())for(const [j,target]of item.targets.entries()){
  if(target.regions.some(r=>!data.targetRegions.includes(r)||r===data.leadingRegion))ctx.addIssue({code:'custom',path:['items',i,'targets',j],message:'Target must be a following canonical service'});
  if(target.startDate&&target.endDate&&target.startDate>target.endDate)ctx.addIssue({code:'custom',message:'Reversed date range'});
  if(target.kind==='confirmed'&&(!target.startDate||!target.sources.some(s=>s.kind==='official')))ctx.addIssue({code:'custom',message:'Target announcement requires an official dated source'});
  if(target.kind==='community'&&(!target.startDate||!target.sources.some(s=>s.kind==='community')))ctx.addIssue({code:'custom',message:'Community date requires its original source'});
  if(target.kind==='lag'&&(target.anchorIds?.length||0)<3)ctx.addIssue({code:'custom',message:'Measured lag requires at least three matching rotations'});
  if(target.kind==='lag'&&target.anchorIds?.some(id=>!data.pairs.some(p=>p.id===id)))ctx.addIssue({code:'custom',message:'Missing historical date pair'});
 }
});
export type Foresight=z.infer<typeof foresightSchema>;
export type ForesightItem=z.infer<typeof foresightItemSchema>;
export type ForesightSource=z.infer<typeof foresightSourceSchema>;
export const canonicalForesightRegion=(gameId:string,requested:Region):Region=>gameId==='bluearchive'?'kr':gameId==='reverse1999'?'global':requested==='cn'?'global':requested;
export const defaultForesightRegion=(gameId:string,locale:Locale)=>canonicalForesightRegion(gameId,locale==='ko'?'kr':locale==='ja'?'jp':'global');
const utc=(day:string)=>Date.parse(day+'T00:00:00Z');
export const addForesightDays=(day:string,days:number)=>new Date(utc(day)+days*86400000).toISOString().slice(0,10);
export function foresightLag(pairs:Foresight['pairs']){
 const days=pairs.map(p=>Math.round((utc(p.targetDate)-utc(p.leadingDate))/86400000)).filter(n=>n>0&&n<730).sort((a,b)=>a-b);
 return days.length?{min:days[0],max:days.at(-1)!,median:days[Math.floor(days.length/2)],count:days.length}:null;
}
export function foresightTiming(data:Foresight,item:ForesightItem,requested:Region){
 const target=item.targets.find(t=>t.regions.includes(canonicalForesightRegion(data.gameId,requested)));if(!target)return null;
 if(target.kind!=='lag')return {...target};
 const lag=foresightLag(data.pairs.filter(p=>target.anchorIds!.includes(p.id)));if(!lag||lag.count<3)return null;
 let startDate=addForesightDays(item.leading.startDate,lag.min),endDate=addForesightDays(item.leading.startDate,lag.max);
 if(target.precision==='month'){startDate=startDate.slice(0,7)+'-01';const last=new Date(utc(endDate));last.setUTCMonth(last.getUTCMonth()+1,0);endDate=last.toISOString().slice(0,10);}
 return {...target,startDate,endDate,lag};
}
export function foresightRows(data:Foresight,region:Region,now:number){
 const today=new Date(now).toISOString().slice(0,10);
 return data.items.map(item=>({item,timing:foresightTiming(data,item,region)})).filter((row):row is {item:ForesightItem;timing:NonNullable<ReturnType<typeof foresightTiming>>}=>!!row.timing).map(row=>({...row,elapsed:!!(row.timing.endDate||row.timing.startDate)&&(row.timing.endDate||row.timing.startDate)!<today})).sort((a,b)=>(a.timing.startDate||'9999').localeCompare(b.timing.startDate||'9999')||a.item.leading.startDate.localeCompare(b.item.leading.startDate)||a.item.id.localeCompare(b.item.id));
}
