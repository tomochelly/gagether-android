import type {Entry,SourceCheck} from './types';
import type {SiteSettings} from './editorial';

type Value=null|boolean|number|Value[];
export type PackedCatalog={format:'catalog-1';strings:string[];shapes:string[][];value:Value};
export type CatalogData={gameScope?:string;entries:Entry[];sourceChecks:SourceCheck[];settings:SiteSettings;persistent:boolean;serverTime:string;settingsRevision:number};

// Lossless wire representation only: repeated field names and exact strings are
// transmitted once. All languages, artwork URLs, owner revisions and dates stay
// intact. No persisted data is rewritten or locale fallback synthesized.
export function packCatalog(data:CatalogData):PackedCatalog{
 const strings:string[]=[],shapes:string[][]=[];
 const stringIds=new Map<string,number>(),shapeIds=new Map<string,number>();
 const encode=(value:unknown):Value=>{
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number')return [-2,value];
  if(typeof value==='string'){
   let id=stringIds.get(value);if(id===undefined){id=strings.length;strings.push(value);stringIds.set(value,id);}return id;
  }
  if(Array.isArray(value))return [-1,...value.map(v=>encode(v===undefined?null:v))];
  const pairs=Object.entries(value as Record<string,unknown>).filter(([,v])=>v!==undefined);
  const keys=pairs.map(([k])=>k),key=JSON.stringify(keys);
  let id=shapeIds.get(key);if(id===undefined){id=shapes.length;shapes.push(keys);shapeIds.set(key,id);}
  return [id,...pairs.map(([,v])=>encode(v))];
 };
 return {format:'catalog-1',strings,shapes,value:encode(data)};
}
export function unpackCatalog(data:PackedCatalog):CatalogData{
 if(data.format!=='catalog-1')throw new Error('Unsupported catalog transport');
 const decode=(value:Value):unknown=>{
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number')return data.strings[value];
  const [tag,...values]=value;
  if(tag===-2)return values[0];
  if(tag===-1)return values.map(decode);
  return Object.fromEntries(data.shapes[tag as number].map((key,i)=>[key,decode(values[i])]));
 };
 return decode(data.value) as CatalogData;
}
