import type {Region} from './types';

export const PERSONAL_NOTES_KEY='gagether.personal-notes.v1';
export const NOTE_LIMIT=2000;
export type NoteKind='memo'|'pull'|'plan';
export type PersonalNote={id:string;date:string;gameId?:string;region?:Region;kind:NoteKind;title:string;body:string;createdAt:string;updatedAt:string};
export type NoteDraft=Pick<PersonalNote,'date'|'gameId'|'region'|'kind'|'title'|'body'>;
export type NoteErrorCode='unavailable'|'invalid'|'conflict'|'limit';
export class NoteStoreError extends Error {constructor(public code:NoteErrorCode){super(code);}}
export type NoteStorage=Pick<Storage,'getItem'|'setItem'>;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const stamp=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT/.test(v)&&Number.isFinite(Date.parse(v));
export function isNoteDate(v:unknown):v is string{
 if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||v<'1900-01-01'||v>'2199-12-31')return false;
 const time=Date.parse(v+'T12:00:00Z');return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===v;
}
export function validNoteDraft(v:unknown):v is NoteDraft{
 return object(v)&&isNoteDate(v.date)&&['memo','pull','plan'].includes(v.kind as string)&&typeof v.title==='string'&&!!v.title.trim()&&v.title.length<=120&&typeof v.body==='string'&&v.body.length<=2000&&(v.gameId===undefined||typeof v.gameId==='string'&&/^[a-z0-9-]{1,60}$/.test(v.gameId))&&(v.region===undefined||!!v.gameId&&['global','kr','jp','cn'].includes(v.region as string))&&(v.region!=='cn'||v.gameId==='arknights'||v.gameId==='gfl2'||v.gameId==='reverse1999');
}
export function decodeNotes(raw:string|null):PersonalNote[]{
 if(raw===null)return [];
 let value:unknown;try{value=JSON.parse(raw);}catch{throw new NoteStoreError('invalid');}
 if(!object(value)||value.version!==1||!Array.isArray(value.notes)||value.notes.length>NOTE_LIMIT)throw new NoteStoreError('invalid');
 const ids=new Set<string>();
 for(const n of value.notes){
  if(!object(n)||typeof n.id!=='string'||!n.id||n.id.length>100||ids.has(n.id)||!stamp(n.createdAt)||!stamp(n.updatedAt))throw new NoteStoreError('invalid');
  const id=n.id;if(!validNoteDraft(n))throw new NoteStoreError('invalid');ids.add(id);
 }
 return value.notes as PersonalNote[];
}
export function readNotes(storage:NoteStorage){
 let raw:string|null;try{raw=storage.getItem(PERSONAL_NOTES_KEY);}catch{throw new NoteStoreError('unavailable');}
 return decodeNotes(raw);
}
function writeNotes(storage:NoteStorage,notes:PersonalNote[]){
 try{storage.setItem(PERSONAL_NOTES_KEY,JSON.stringify({version:1,notes}));}catch{throw new NoteStoreError('unavailable');}
 return notes;
}
// Re-read before each mutation so a second tab's unrelated records are preserved.
// Editing a stale record requires reopening it instead of overwriting newer text.
export function saveNote(storage:NoteStorage,draft:NoteDraft,previous?:PersonalNote,now=new Date().toISOString(),id=globalThis.crypto.randomUUID()):PersonalNote[]{
 if(!validNoteDraft(draft)||!stamp(now))throw new NoteStoreError('invalid');
 const notes=readNotes(storage);const current=previous?notes.find(n=>n.id===previous.id):undefined;
 if(previous&&(!current||JSON.stringify(current)!==JSON.stringify(previous)))throw new NoteStoreError('conflict');
 if(!previous&&notes.length>=NOTE_LIMIT)throw new NoteStoreError('limit');
 if(!previous&&notes.some(n=>n.id===id))throw new NoteStoreError('conflict');
 const next:PersonalNote={...draft,title:draft.title.trim(),body:draft.body.trim(),id:previous?.id||id,createdAt:previous?.createdAt||now,updatedAt:now};
 return writeNotes(storage,previous?notes.map(n=>n.id===previous.id?next:n):[...notes,next]);
}
export function removeNote(storage:NoteStorage,previous:PersonalNote){
 const notes=readNotes(storage),current=notes.find(n=>n.id===previous.id);
 if(!current||JSON.stringify(current)!==JSON.stringify(previous))throw new NoteStoreError('conflict');
 return writeNotes(storage,notes.filter(n=>n.id!==previous.id));
}
export function notesForScope(notes:PersonalNote[],scope:{gameId?:string;region?:Region;myOnly?:boolean;favorites?:string[]},canonical:(gameId:string,region:Region)=>Region){
 return notes.filter(n=>{
  if(scope.gameId&&n.gameId!==scope.gameId)return false;
  if(!scope.gameId&&scope.myOnly&&n.gameId&&!scope.favorites?.includes(n.gameId))return false;
  return !n.gameId||!n.region||!scope.region||canonical(n.gameId,n.region)===canonical(n.gameId,scope.region);
 });
}
export function weekDates(selected:string){
 const day=Date.parse(selected+'T12:00:00Z'),offset=new Date(day).getUTCDay();
 return Array.from({length:7},(_,i)=>new Date(day+(i-offset)*86400000).toISOString().slice(0,10));
}
export const shiftNoteDate=(day:string,amount:number)=>new Date(Date.parse(day+'T12:00:00Z')+amount*86400000).toISOString().slice(0,10);
