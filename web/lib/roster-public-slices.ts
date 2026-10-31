import {env} from 'cloudflare:workers';
import {characterRosterSchema} from './character-roster';
import type {CharacterRoster} from './character-roster';
type Index={version:1;gameId:string;revision:string;catalog?:{version:3;sourceUrl:string;checkedAt:string};meta:Omit<CharacterRoster,'characters'|'detailCatalog'>;records:Record<string,{offset:number;bytes:number;sha256:string}>};
const digest=async(bytes:Uint8Array)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as Uint8Array<ArrayBuffer>))].map(b=>b.toString(16).padStart(2,'0')).join('');
const prefix=(gameId:string)=>'runtime/public-roster-slices/v1/'+gameId+'/';
/** One source-validated public lookup bundle. Detail blocks remain compressed
 * and exact; a detail request reads only its character's checked byte range.
 * Fixed per-game cache slots cannot grow into another historical source store. */
export async function savePublicRosterSlices(data:CharacterRoster,revision:string){
 if(!env.BUCKET||data.detailCatalog&&data.detailCatalog.version!==3)return;
 const {characters,detailCatalog,...meta}=data,encoder=new TextEncoder(),chunks:Uint8Array[]=[],records:Index['records']=Object.create(null);let offset=0;
 for(const character of characters){const form=detailCatalog?.forms[character.id],bytes=encoder.encode(JSON.stringify({character,...form?{form}:{}}));if(bytes.length>1_500_000)return;chunks.push(bytes);records[character.id]={offset,bytes:bytes.length,sha256:''};offset+=bytes.length;}
 if(offset>12_000_000)return;
 const hashes=await Promise.all(chunks.map(digest));characters.forEach((c,i)=>records[c.id].sha256=hashes[i]);
 const body=new Uint8Array(offset);let at=0;for(const bytes of chunks){body.set(bytes,at);at+=bytes.length;}
 const index:Index={version:1,gameId:data.gameId,revision,meta,records,...detailCatalog?{catalog:{version:3 as const,sourceUrl:detailCatalog.sourceUrl,checkedAt:detailCatalog.checkedAt}}:{}};
 await env.BUCKET.put(prefix(data.gameId)+'body',body,{httpMetadata:{contentType:'application/octet-stream',cacheControl:'private, no-store'},customMetadata:{revision}});
 const indexText=JSON.stringify(index);await env.BUCKET.put(prefix(data.gameId)+'index.json',indexText,{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'},customMetadata:{revision,indexHash:await digest(encoder.encode(indexText))}});
}
export async function readPublicRosterSlice(gameId:string,id:string,revision:string):Promise<{data:CharacterRoster;source:Index['meta']}|{missing:true}|null>{
 try{
  const object=await env.BUCKET?.get(prefix(gameId)+'index.json');if(!object)return null;
  if(object.customMetadata?.revision!==revision){await object.body?.cancel();return null;}
  const text=await object.text();if(text.length>1_000_000||await digest(new TextEncoder().encode(text))!==object.customMetadata.indexHash)return null;
  const index=JSON.parse(text) as Index;
  if(index.version!==1||index.gameId!==gameId||index.revision!==revision||index.meta?.gameId!==gameId||!index.records||Object.keys(index.records).length!==index.meta.coverage?.includedCount)return null;
  if(!Object.hasOwn(index.records,id))return {missing:true};
  const record=index.records[id];if(!Number.isInteger(record.offset)||record.offset<0||!Number.isInteger(record.bytes)||record.bytes<1||record.bytes>1_500_000||record.offset+record.bytes>12_000_000||!/^[a-f0-9]{64}$/.test(record.sha256))return null;
  const slice=await env.BUCKET!.get(prefix(gameId)+'body',{range:{offset:record.offset,length:record.bytes}});if(!slice)return null;
  if(slice.customMetadata?.revision!==revision){await slice.body?.cancel();return null;}
  const bytes=new Uint8Array(await slice.arrayBuffer());if(bytes.length!==record.bytes||await digest(bytes)!==record.sha256)return null;
  const {character,form}=JSON.parse(new TextDecoder().decode(bytes));if(character?.id!==id)return null;
  // This read-only one-character projection never enters collection writers.
  const data=characterRosterSchema.parse({...index.meta,characters:[character],coverage:{...index.meta.coverage,includedCount:1},...form?{detailCatalog:{...index.catalog,version:3,forms:{[id]:form}}}:{}});
  return {data,source:index.meta};
 }catch{return null;}
}
