import {z} from 'zod';
import type {ImageFrame} from './types';

export const rosterFrameSchema=z.object({x:z.number().min(-100).max(200),y:z.number().min(-100).max(200),zoom:z.number().min(.05).max(6),fit:z.enum(['contain','cover'])}).strict();
export type RosterArtSurface='gallery'|'detail';
export const rosterArtChangeKey='gagether.roster-art.v1';
/** Only immutable Site asset aliases are equivalent; unrelated URLs stay distinct. */
export function rosterArtUrl(value:string){
 try{const u=new URL(value,'https://gagether.wiki');if(['gagether.wiki','gagether.tomochelly.chatgpt.site'].includes(u.hostname)&&/^\/(?:roster-bootstrap\/[a-f0-9]{64}\.(?:png|webp|jpg|avif)|api\/wuwa\/artwork\/[a-f0-9]{64})$/.test(u.pathname)&&!u.search)return u.pathname;}catch{}
 return value;
}
const artUrl=z.string().min(1).max(2000).refine(v=>{if(/^\/(?:roster-bootstrap\/[a-f0-9]{64}\.(?:png|webp|jpg|avif)|api\/wuwa\/artwork\/[a-f0-9]{64})$/.test(v))return true;try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port;}catch{return false;}});
export const rosterArtPlacementSchema=z.object({url:artUrl,gallery:rosterFrameSchema.optional(),detail:rosterFrameSchema.optional()}).strict();
export const rosterArtFramesSchema=z.object({images:z.array(rosterArtPlacementSchema).max(40).refine(rows=>new Set(rows.map(a=>rosterArtUrl(a.url))).size===rows.length,'Duplicate exact image')}).strict();
export type RosterArtPlacement=z.infer<typeof rosterArtPlacementSchema>;
export type RosterArtFrames=z.infer<typeof rosterArtFramesSchema>;
export function rosterArtFrame(rows:RosterArtPlacement[]|undefined,url:string|undefined,surface:RosterArtSurface):ImageFrame|undefined{return url?rows?.find(r=>rosterArtUrl(r.url)===rosterArtUrl(url))?.[surface]:undefined;}
export function rosterArtKey(gameId:string,id:string){return 'roster-art:'+gameId+':'+encodeURIComponent(id);}
export function ownerRosterArtPath(gameId:string,id?:string,url?:string){return '/owner/characters?'+new URLSearchParams({game:gameId,...id?{id}:{},...url?{image:rosterArtUrl(url)}:{}});}
export function setRosterArtFrame(value:RosterArtFrames,url:string,surface:RosterArtSurface,frame:ImageFrame|undefined):RosterArtFrames{
 const key=rosterArtUrl(url),rows=value.images.filter(r=>rosterArtUrl(r.url)!==key),row={...value.images.find(r=>rosterArtUrl(r.url)===key),url:key};
 if(frame)row[surface]=frame;else delete row[surface];
 if(row.gallery||row.detail)rows.push(row);
 return {images:rows.sort((a,b)=>a.url.localeCompare(b.url))};
}
export function mergeRosterArtDraft(base:RosterArtFrames,mine:RosterArtFrames,current:RosterArtFrames){
 let value=current;const conflicts:{url:string;surface:RosterArtSurface;mine?:ImageFrame;current?:ImageFrame}[]=[];
 const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b),urls=new Set([...base.images,...mine.images,...current.images].map(a=>rosterArtUrl(a.url)));
 for(const url of urls)for(const surface of ['gallery','detail'] as const){const before=rosterArtFrame(base.images,url,surface),ours=rosterArtFrame(mine.images,url,surface),theirs=rosterArtFrame(current.images,url,surface);if(same(ours,before))continue;if(!same(theirs,before)&&!same(ours,theirs))conflicts.push({url,surface,mine:ours,current:theirs});else value=setRosterArtFrame(value,url,surface,ours);}
 return {value,conflicts};
}
