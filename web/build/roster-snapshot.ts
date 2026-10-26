import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {Plugin} from 'vite';
import {packCatalog,unpackCatalog,type CatalogData} from '../lib/catalog-transport';
export const rosterSnapshotModule='\0gagether:roster-bootstrap-packed.js';
/** Generated representation only. Canonical source bytes/hash never change. */
export function lazyRosterCode(rows:{gameId:string;[key:string]:unknown}[]){
 const encoded=rows.map(row=>({gameId:row.gameId,keys:Object.keys(row),body:JSON.stringify(packCatalog(row as unknown as CatalogData))}));
 return `const unpack=${unpackCatalog.toString()};\nexport default ${JSON.stringify(encoded)}.map(({gameId,keys,body})=>{let full;const read=()=>full??=(unpack(JSON.parse(body)));const row={};for(const key of keys)Object.defineProperty(row,key,key==='gameId'?{value:gameId,enumerable:true,writable:true,configurable:true}:{get(){return read()[key]},enumerable:true,configurable:true});return row;});`;
}
export function lazyRosterSnapshot():Plugin{
 const canonical=resolve('content/character-rosters/bootstrap.json');let generated:string|undefined;
 return {name:'gagether-lazy-roster-snapshot',apply:'build',enforce:'pre',async resolveId(source,importer){
  if(!source.endsWith('/character-rosters/bootstrap.json'))return;
  const found=await this.resolve(source,importer,{skipSelf:true});
  if(found?.id===canonical)return rosterSnapshotModule;
 },load(id){if(id!==rosterSnapshotModule)return;this.addWatchFile(canonical);return generated??=(lazyRosterCode(JSON.parse(readFileSync(canonical,'utf8'))));}};
}
