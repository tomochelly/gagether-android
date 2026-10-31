
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {gzipSync} from 'node:zlib';
import type {Plugin} from 'vite';
const publicPresentationFiles=['reviewed-public-copy.json','reviewed-public-summaries.json','reviewed-source-excerpt.json','reviewed-korean-spacing.json','reviewed-pickup-artwork.json','maintained-artwork.json','gallery-focus-runtime.json','gallery-framing-runtime.json'];
const files=['roster-detail-icons.json','wuwa-reference.json','wuwa-equipment-catalog.json','wuwa-wastes-tokens.json','wuwa-equipment-images.json','reviewed-broadcast-analysis.json','gfl2-combat-catalog.json','official-pickup-updates.json','recurring-reviewed-entries.json','additional-game-entries.json','reviewed-pickup-localization.json',...publicPresentationFiles];
const portable=(p:string)=>p.replace(/\\/g,'/');
/** Lossless build representation. Canonical files and every native fact stay intact. */
export function packedWuwaCode(bytes:Uint8Array){
 if(bytes.length>4_400_000)throw Error('WuWa source JSON exceeds its bounded decoder');
 JSON.parse(new TextDecoder().decode(bytes));
 const body=gzipSync(bytes,{level:9}).toString('base64');
 return "import {gunzipSync} from 'node:zlib';import {Buffer} from 'node:buffer';const raw=gunzipSync(Buffer.from("+JSON.stringify(body)+",'base64'),{maxOutputLength:4_400_000});if(raw.length!=="+bytes.length+")throw Error('WuWa source size mismatch');export default JSON.parse(new TextDecoder().decode(raw));";
}
export function packedWuwaData():Plugin{
 const paths=new Map(files.map(name=>[portable(resolve('content',name)),name])),cache=new Map<string,string>();
 return {name:'gagether-packed-wuwa-data',apply:'build',enforce:'pre',async resolveId(source,importer){
  if(!files.some(name=>portable(source).endsWith('/'+name)))return;
  const found=await this.resolve(source,importer,{skipSelf:true});if(!found)return;const name=paths.get(portable(found.id));if(!name)return;
  // Public presentation data keeps its ordinary browser JSON module. Only the
  // generated server representation is compressed, preserving every string.
  if(this.environment.name==='client'){if(publicPresentationFiles.includes(name))return;throw Error('Full WuWa source catalogs must stay server-side');}
  return '\0gagether:packed-'+name+'.js';
 },load(id){const name=files.find(name=>id==='\0gagether:packed-'+name+'.js');if(!name)return;const path=resolve('content',name);this.addWatchFile(path);if(!cache.has(name))cache.set(name,packedWuwaCode(readFileSync(path)));return cache.get(name)!;}};
}
