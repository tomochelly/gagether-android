import {decodeNotes,type PersonalNote} from './personal-notes';
import {parsePersonalLayouts,mergePersonalLayouts,type PersonalLayouts} from './personal-layout';
export type AccountProfile={favorites:string[];saved:string[];order:string[];notes:PersonalNote[];layouts?:PersonalLayouts};
export const emptyProfile=():AccountProfile=>({favorites:[],saved:[],order:[],notes:[]});
export const profileLimit=1_500_000;
export const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
function ids(v:unknown,max:number){
 if(!Array.isArray(v)||v.length>max||v.some(x=>typeof x!=='string'||!x||x.length>200||!/^[-a-zA-Z0-9_.:]+$/.test(x))||new Set(v).size!==v.length)throw Error('Invalid IDs');
 return v as string[];
}
export function parseProfile(value:unknown):AccountProfile{
 if(!value||typeof value!=='object')throw Error('Invalid profile');
 const v=value as AccountProfile;
 const notes=decodeNotes(JSON.stringify({version:1,notes:v.notes})).map(n=>({id:n.id,date:n.date,...(n.gameId?{gameId:n.gameId}:{}),...(n.region?{region:n.region}:{}),kind:n.kind,title:n.title,body:n.body,createdAt:n.createdAt,updatedAt:n.updatedAt}));
 const layouts=parsePersonalLayouts(v.layouts);
 const p={favorites:ids(v.favorites,100),saved:ids(v.saved,4000),order:ids(v.order,100),notes,...(Object.keys(layouts).length?{layouts}:{})};
 if(new TextEncoder().encode(JSON.stringify(p)).length>profileLimit)throw Error('Profile too large');
 return p;
}
function mergeSet(base:string[],local:string[],remote:string[]){
 const removed=new Set(base.filter(id=>!local.includes(id)));
 return [...new Set([...remote.filter(id=>!removed.has(id)),...local.filter(id=>!base.includes(id))])].sort();
}
function copyId(note:PersonalNote){
 // Stable identity keeps a retried concurrent edit from creating more copies.
 let a=2166136261,b=5381;for(const c of JSON.stringify(note)){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b,33)^c.charCodeAt(0);}
 return 'sync-copy-'+note.id.slice(0,50)+'-'+(a>>>0).toString(16)+(b>>>0).toString(16);
}
/** Three-way merge: unchanged stale devices cannot resurrect deleted selections/notes. */
export function mergeProfile(base:AccountProfile|null,local:AccountProfile,remote:AccountProfile):AccountProfile{
 const initial=base===null,b=base||emptyProfile();
 const notes=new Map(remote.notes.map(n=>[n.id,n])),before=new Map(b.notes.map(n=>[n.id,n])),mine=new Map(local.notes.map(n=>[n.id,n]));
 for(const id of new Set([...before.keys(),...mine.keys()])){
  const old=before.get(id),next=mine.get(id),other=notes.get(id);
  if(equal(old,next)||equal(next,other))continue;
  if(equal(old,other)){if(next)notes.set(id,next);else notes.delete(id);}
  else if(next){notes.set(copyId(next),{...next,id:copyId(next)});} // Keep both edits, including edit-versus-delete.
  // A concurrent remote edit survives a stale local delete.
 }
 return parseProfile({favorites:mergeSet(b.favorites,local.favorites,remote.favorites),saved:mergeSet(b.saved,local.saved,remote.saved),order:initial?(remote.order.length?remote.order:local.order):equal(b.order,local.order)?remote.order:local.order,notes:[...notes.values()].sort((a,b)=>a.id.localeCompare(b.id)),layouts:mergePersonalLayouts(b.layouts,local.layouts,remote.layouts,initial)});
}
