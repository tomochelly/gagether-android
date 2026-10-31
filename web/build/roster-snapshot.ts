import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {gzipSync} from 'node:zlib';
import type {Plugin} from 'vite';
export const rosterSnapshotModule='\0gagether:roster-bootstrap-packed.js';
const portablePath=(path:string)=>path.replace(/\\/g,'/');
/** Generated representation only. Canonical source bytes/hash never change. */
export function lazyRosterCode(rows:{gameId:string;[key:string]:unknown}[]){
 const encoded=rows.map(row=>{const bytes=Buffer.from(JSON.stringify(row));if(bytes.length>4_400_000)throw Error('Game roster exceeds its existing ingest bound');return {gameId:row.gameId,keys:Object.keys(row),bytes:bytes.length,body:gzipSync(bytes,{level:9}).toString('base64')};});
 // Workers also uses maxOutputLength as an inflater allocation budget. Setting
 // it to the exact small JSON size can fail before any output is returned.
 // Retain the existing per-game ingest bound, then verify the exact byte count.
 return `import {gunzipSync as unzip} from 'node:zlib';\nimport {Buffer} from 'node:buffer';\nconst cache=new Map();\nexport default ${JSON.stringify(encoded)}.map(({gameId,keys,bytes,body})=>{const read=()=>{let full=cache.get(gameId);if(full){cache.delete(gameId);cache.set(gameId,full);return full;}const raw=unzip(Buffer.from(body,'base64'),{maxOutputLength:4_400_000});if(raw.length!==bytes)throw Error('Roster bootstrap size mismatch');full=JSON.parse(new TextDecoder().decode(raw));cache.set(gameId,full);if(cache.size>2)cache.delete(cache.keys().next().value);return full;};const row={};for(const key of keys)Object.defineProperty(row,key,key==='gameId'?{value:gameId,enumerable:true,writable:true,configurable:true}:{get(){return read()[key]},enumerable:true,configurable:true});return row;});`;
}
export function lazyRosterSnapshot():Plugin{
 const canonical=resolve('content/character-rosters/bootstrap.json');let generated:string|undefined;
 return {name:'gagether-lazy-roster-snapshot',apply:'build',enforce:'pre',async resolveId(source,importer){
  if(!portablePath(source).endsWith('/character-rosters/bootstrap.json'))return;
  const found=await this.resolve(source,importer,{skipSelf:true});
  if(found&&portablePath(found.id)===portablePath(canonical))return rosterSnapshotModule;
 },load(id){if(id!==rosterSnapshotModule)return;this.addWatchFile(canonical);return generated??=(lazyRosterCode(JSON.parse(readFileSync(canonical,'utf8'))));}};
}
