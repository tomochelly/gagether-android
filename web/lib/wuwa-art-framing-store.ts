import {readWuwaReference} from './wuwa-reference-store';
import {readRosterArtFrames} from './roster-art-frame-reader';
const digest=async(value:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');
/** WuWa presentation does not import the other17 games' complete roster originals. */
export async function readWuwaReferenceView(){
 const base=await readWuwaReference(),records=await readRosterArtFrames('wuwa'),known=new Map(records.map(r=>[r.id,r.value.images]));
 return {...base,data:{...base.data,characters:base.data.characters.map(c=>known.has(c.id)?{...c,artworkFrames:known.get(c.id)!}:c)},hash:records.length?await digest({source:base.hash,records:records.map(({key,...r})=>r)}):base.hash};
}
