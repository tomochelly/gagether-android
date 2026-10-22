// Vite also emits a server copy of CSS, but Wrangler serves CSS solely from
// assets.directory (dist/client). Drop only byte-identical generated copies.
// Keep all original art, fonts and the public stylesheet untouched.
import {readdirSync,existsSync,readFileSync,unlinkSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {pruneGeneratedChunks} from './prune-generated-chunks.mjs';
// Transfer work directories can outlive a completed build; nothing imports them.
// They contain temporary duplicates, not artwork or runtime output paths.
function removeTransferScratch(dir){
 if(!existsSync(dir))return;
 for(const item of readdirSync(dir,{withFileTypes:true}))if(item.isDirectory()){
  const path=join(dir,item.name);
  if(item.name==='.rsync-tmp')rmSync(path,{recursive:true,force:true});
  else removeTransferScratch(path);
 }
}
removeTransferScratch('dist');
const root='dist/server/_next/static/css';
if(existsSync(root))for(const name of readdirSync(root)){
 if(!name.endsWith('.css'))continue;
 const server=join(root,name),client=join('dist/client/_next/static/css',name);
 if(existsSync(client)&&readFileSync(server).equals(readFileSync(client)))unlinkSync(server);
}

// Drop transfer partials only when they are exact prefixes of complete artwork.
// They can occur in selection art as well as the native artwork directory.
function removeArtworkPartials(dir){
 if(!existsSync(dir))return;
 for(const item of readdirSync(dir,{withFileTypes:true})){
  if(item.isDirectory()){removeArtworkPartials(join(dir,item.name));continue;}
  const match=/^\.(.+)\.[A-Za-z0-9]{6}$/.exec(item.name);if(!match)continue;
  // Abandoned transfer files absent from public source are never runtime assets.
  if(!existsSync(join('public',dir.replace(/^dist\/client\//,''),item.name))){unlinkSync(join(dir,item.name));continue;}
  const complete=join(dir,match[1]);if(!existsSync(complete))continue;
  const part=join(dir,item.name),bytes=readFileSync(part),original=readFileSync(complete);
  if(bytes.length<original.length&&bytes.equals(original.subarray(0,bytes.length)))unlinkSync(part);
 }
}
removeArtworkPartials('dist/client/assets');
// Vite's build inventory is not read by the emitted worker or client bundles.
for(const file of ['dist/client/.vite/manifest.json','dist/server/.vite/manifest.json'])if(existsSync(file))unlinkSync(file);
pruneGeneratedChunks('dist');
