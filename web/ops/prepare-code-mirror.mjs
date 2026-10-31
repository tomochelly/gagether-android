// Prepare an offline code-mirror transfer. This module never writes to GitHub.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,lstatSync,mkdirSync,readdirSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Owner explicitly expanded private data exclusions on 2026-10-31.
export const canonicalOnly=Object.freeze([
 "content/additional-game-assets.json",
 "content/additional-game-entries.json",
 "content/arknights-gallery-focus.json",
 "content/arknights-preview-images.json",
 "content/artwork-audit-2026-10-16.json",
 "content/assets-hoyo-provenance.json",
 "content/assets-kuro-asset-sources.json",
 "content/assets-other-exact-audit.json",
 "content/assets-others-manifest.json",
 "content/bluearchive-reviewed-banners.json",
 "content/catalog-preview-images.json",
 "content/character-rosters/artwork-manifest.json",
 "content/character-rosters/bootstrap.json",
 "content/character-rosters/recovery/manifest.json",
 "content/character-rosters/rejected-artwork.json",
 "content/character-rosters/restricted-artwork.json",
 "content/combat-display.json",
 "content/combat-research.json",
 "content/community-others-notes.json",
 "content/endfield-gallery-focus.json",
 "content/entity-catalog.json",
 "content/excluded-source-images.json",
 "content/foresight.json",
 "content/four-games-gallery-focus.json",
 "content/full-artwork-review-2026-10-16.json",
 "content/gallery-focus-runtime.json",
 "content/gallery-framing-runtime.json",
 "content/gallery-protected-heads.json",
 "content/gallery-subject-bounds.json",
 "content/gfl2-combat-catalog.json",
 "content/holodreams-gallery-focus.json",
 "content/hoyo-localization-research.json",
 "content/hoyo-localized.json",
 "content/hsr-announced-roster.json",
 "content/hsr-gallery-focus.json",
 "content/kuro-image-audit.json",
 "content/kuro-localization-research.json",
 "content/kuro-localized.json",
 "content/leaks/bootstrap.json",
 "content/leaks/source-media.json",
 "content/leaks/x-artwork-manifest.json",
 "content/limbus-reviewed-releases.json",
 "content/maintained-artwork.json",
 "content/maintained-video-notices.json",
 "content/maintenance-gallery-focus.json",
 "content/migrations/pickup-rewards-20261024.json",
 "content/native-icon-provenance.json",
 "content/nikke-recruit-pool.json",
 "content/nte-announced-roster.json",
 "content/nte-profile-sources.json",
 "content/official-pickup-updates.json",
 "content/official-video-channels.json",
 "content/others-adapters-assets.json",
 "content/others-additions-research.json",
 "content/others-additions.json",
 "content/others-localization-research.json",
 "content/others-localized.json",
 "content/pickup-member-icons.json",
 "content/pickup-thumbnail-focus.json",
 "content/release-additions-20261025.json",
 "content/research-hoyo.json",
 "content/research-kuro-hypergryph.json",
 "content/research-others.json",
 "content/reviewed-broadcast-media.json",
 "content/reviewed-owner-artwork-repairs.json",
 "content/reviewed-pickup-artwork.json",
 "content/reviewed-roster-information.json",
 "content/reviewed-trickcal-pickups.json",
 "content/reward-assets.json",
 "content/reward-catalog.json",
 "content/roster-detail-icons.json",
 "content/roster-material-icons.json",
 "content/silver-palace-roster.json",
 "content/stat-icons.json",
 "content/trait-icons.json",
 "content/uma-selection-art-review-2026-10-17.json",
 "content/upcoming-games.json",
 "content/version-art-review-2026-10-17.json",
 "content/wiki-icon-additions.json",
 "content/wuwa-announced-roster.json",
 "content/wuwa-build-guides.json",
 "content/wuwa-character-videos.json",
 "content/wuwa-combat-artwork.json",
 "content/wuwa-combat-image-repairs.json",
 "content/wuwa-convene-character-cards.json",
 "content/wuwa-convene-media.json",
 "content/wuwa-convene-weapons.json",
 "content/wuwa-equipment-catalog.json",
 "content/wuwa-equipment-images.json",
 "content/wuwa-material-provenance.json",
 "content/wuwa-reference-artwork.json",
 "content/wuwa-reference-framing.json",
 "content/wuwa-reference-splashes.json",
 "content/wuwa-reference.json",
 "content/wuwa-upcoming-3-8.json",
 "content/wuwa-wastes-tokens.json",
 "content/zzz-combat-catalog.json",
 "content/zzz-equipment-images.json",
 "content/zzz-reviewed-artwork.json"
]);
const protectedPaths=new Set(canonicalOnly);
const auxiliaryFiles=Object.freeze([
 'ops/character-rosters/run.py',
 'ops/character-rosters/test_run.py',
 'ops/character-rosters/public-sources/collect_rosters.py',
 'ops/character-rosters/public-sources/test_collector.py',
 'ops/character-rosters/enrichment/zzz/enrich.py',
 'ops/character-rosters/enrichment/zzz/test_enrich.py',
 'tests/roster-availability.test.mjs',
 'tests/wuwa-announcements.test.mjs',
 'tests/spotlight-thumbnails.test.mjs',
 'tests/content-audience.test.mjs',
 'tests/character-name-stars.test.mjs',
 'tests/leak-collection-resilience.test.mjs',
 'tests/leak-refresh-health.test.mjs',
]);
const hash=data=>createHash('sha256').update(data).digest('hex');
const inside=(root,file)=>file===root||file.startsWith(root+path.sep);
const protectedPath=p=>protectedPaths.has(p)||/(^|\/)recovery\/.*\.b64$/i.test(p);

function safePath(p){
 if(typeof p!=='string'||!p||p.length>1000||/[\\\x00-\x1f\x7f]/.test(p)||p.startsWith('/')||p.split('/').some(s=>!s||s==='.'||s==='..'))throw Error('Invalid relative source path');
 return p;
}
function runtimePath(p){
 return /^(?:app|components|lib|content|build)\/.+\.(?:ts|tsx|json|css|js|mjs)$/.test(p)
  ||/^drizzle\/[^/]+\.sql$/.test(p)
  ||['db/schema.ts','drizzle/meta/_journal.json','package.json','pnpm-lock.yaml','vite.config.ts','.openai/hosting.json'].includes(p);
}
function runtimeInventory(root){
 const files=[];
 function walk(relative){
  const absolute=path.join(root,relative);if(!existsSync(absolute))return;
  if(lstatSync(absolute).isSymbolicLink())throw Error('Source is not a regular, non-symlink file: '+relative);
  for(const entry of readdirSync(absolute,{withFileTypes:true})){
   const p=relative+'/'+entry.name;
   if(entry.isDirectory())walk(p);else if(/\.(ts|tsx|json|css|js|mjs)$/.test(p))files.push(p);
  }
 }
 for(const dir of ['app','components','lib','content','build'])walk(dir);
 if(existsSync(path.join(root,'drizzle')))for(const entry of readdirSync(path.join(root,'drizzle')))if(entry.endsWith('.sql'))files.push('drizzle/'+entry);
 for(const p of ['db/schema.ts','drizzle/meta/_journal.json','package.json','pnpm-lock.yaml','vite.config.ts','.openai/hosting.json'])if(existsSync(path.join(root,p)))files.push(p);
 return files.sort();
}
function readSource(root,relative){
 safePath(relative);let current=root;const parts=relative.split('/');
 for(let i=0;i<parts.length;i++){
  current=path.join(current,parts[i]);const stat=lstatSync(current);
  if(stat.isSymbolicLink()||(i<parts.length-1?!stat.isDirectory():!stat.isFile()))throw Error('Source is not a regular, non-symlink file: '+relative);
 }
 if(!inside(root,realpathSync(current)))throw Error('Source escaped repository: '+relative);
 return readFileSync(current);
}
function textOf(bytes,relative){
 let text;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw Error('Source is not exact UTF-8 text: '+relative);}
 if(!Buffer.from(text,'utf8').equals(bytes))throw Error('Source UTF-8 roundtrip mismatch: '+relative);
 return text;
}
export function verifyManifest(value,label='manifest'){
 if(!value||Object.keys(value).sort().join(',')!=='entries,fingerprint,version'||value.version!==1||!Array.isArray(value.entries)||!/^[a-f0-9]{64}$/.test(value.fingerprint??''))throw Error('Invalid '+label);
 const paths=new Set();
 for(const entry of value.entries){
  if(!entry||Object.keys(entry).sort().join(',')!=='path,sha256'||!/^[a-f0-9]{64}$/.test(entry.sha256??''))throw Error('Invalid '+label+' entry');
  safePath(entry.path);
  if(!runtimePath(entry.path))throw Error('Unexpected runtime source path in '+label+': '+entry.path);
  if(paths.has(entry.path))throw Error('Duplicate source path in '+label+': '+entry.path);
  paths.add(entry.path);
 }
 if(hash(JSON.stringify(value.entries))!==value.fingerprint)throw Error('Invalid '+label+' fingerprint');
 if(!canonicalOnly.every(p=>paths.has(p)))throw Error('Missing canonical-only hash pins in '+label);
 return value;
}
function scriptAllowed(p){
 if(!p.startsWith('scripts/')||! /\.(?:mjs|js|cjs|ts|py|sh)$/.test(p))return false;
 return !p.split('/').some(segment=>segment.startsWith('.')||segment==='connector-preview'||/(?:^|[-_.])(?:env|secret|secrets|credential|credentials|private|generated|local|cache|qa)(?:[-_.]|$)/i.test(segment));
}
function trackedScripts(root){
 let output;try{output=execFileSync('git',['-C',root,'ls-files','-z','--','scripts'],{encoding:'utf8',maxBuffer:4_000_000,stdio:['ignore','pipe','pipe']});}catch{throw Error('Unable to enumerate tracked scripts');}
 return [...new Set(output.split('\0').filter(Boolean).map(safePath).filter(scriptAllowed))].sort();
}
function parseManifest(bytes,label){
 let value;try{value=JSON.parse(textOf(bytes,label));}catch{throw Error('Unable to parse '+label+' JSON');}
 return verifyManifest(value,label);
}
function boundary(text,end){
 return end>0&&end<text.length&&/[\uD800-\uDBFF]/.test(text[end-1])&&/[\uDC00-\uDFFF]/.test(text[end])?end-1:end;
}
export function transferParts(file,maxCharacters=50_000){
 if(!Number.isInteger(maxCharacters)||maxCharacters<1024||maxCharacters>50_000)throw Error('Transfer JSON pieces must allow 1024 to 50000 characters');
 const base={path:file.path,part:999999999,parts:999999999,fullFileSha256:file.sha256,fullFileBytes:file.bytes,encoding:'utf8'};
 const fits=content=>JSON.stringify({...base,content}).length+1<=maxCharacters;
 if(!fits(''))throw Error('Transfer path metadata exceeds piece bound');
 const chunks=[];let cursor=0;
 do{
  let low=cursor+1,high=file.text.length,end=cursor;
  while(low<=high){const mid=Math.floor((low+high)/2),candidate=boundary(file.text,mid);if(fits(file.text.slice(cursor,candidate))){end=candidate;low=mid+1;}else high=mid-1;}
  if(end===cursor&&cursor<file.text.length)throw Error('Cannot fit one source character in transfer piece');
  chunks.push(file.text.slice(cursor,end));cursor=end;
 }while(cursor<file.text.length);
 if(chunks.length>999999999)throw Error('Too many transfer pieces');
 return chunks.map((content,i)=>JSON.stringify({...base,part:i+1,parts:chunks.length,content})+'\n');
}

/** Inputs must refer to the final saved build. All reads are local; no deployment is inferred. */
export function prepareCodeMirror({root=process.cwd(),oldManifestPath,manifestPath='public/source-manifest.json',outputDir,siteVersion,includeRosterWorkflow=false,maxPieceCharacters=50_000}){
 root=realpathSync(root);
 if(!Number.isSafeInteger(siteVersion)||siteVersion<1)throw Error('A real positive saved site version is required');
 if(!oldManifestPath||!outputDir)throw Error('Old manifest and output directory are required');
 const expectedManifest=path.join(root,'public/source-manifest.json');
 if(path.resolve(root,manifestPath)!==expectedManifest)throw Error('Current manifest must be public/source-manifest.json in the source repository');
 const destination=path.resolve(outputDir);
 if(inside(root,destination)||existsSync(destination))throw Error('Output must be a new directory outside the source repository');
 // Reject output paths whose existing parent resolves back into the repository.
 let ancestor=path.dirname(destination);while(!existsSync(ancestor))ancestor=path.dirname(ancestor);
 if(inside(root,realpathSync(ancestor)))throw Error('Output parent resolves into the source repository');
 const currentBytes=readSource(root,'public/source-manifest.json');
 const old=parseManifest(readFileSync(path.resolve(oldManifestPath)),'old public manifest');
 const current=parseManifest(currentBytes,'current manifest');
 if(JSON.stringify(runtimeInventory(root))!==JSON.stringify(current.entries.map(e=>e.path).sort()))throw Error('Runtime source inventory differs from final source manifest; rebuild before preparing');
 const previous=new Map(old.entries.map(e=>[e.path,e.sha256]));
 const files=new Map();
 const add=(relative,bytes,category,target='web/'+relative)=>{
  safePath(relative);safePath(target);
  if(protectedPath(relative))throw Error('Protected data cannot enter a code transfer: '+relative);
  if(files.has(target))throw Error('Duplicate transfer destination: '+target);
  files.set(target,{path:target,sourcePath:relative,category,sha256:hash(bytes),bytes:bytes.length,text:textOf(bytes,relative)});
 };
 for(const entry of current.entries){
  const bytes=readSource(root,entry.path);
  if(hash(bytes)!==entry.sha256)throw Error('Runtime file does not match final source manifest: '+entry.path);
  if(previous.get(entry.path)!==entry.sha256&&!protectedPath(entry.path))add(entry.path,bytes,'changed-runtime');
 }
 for(const relative of [...trackedScripts(root),...auxiliaryFiles]){
  if(existsSync(path.join(root,relative)))add(relative,readSource(root,relative),relative.startsWith('scripts/')?'tracked-script':'reviewed-auxiliary');
 }
 const receipt={version:1,siteVersion,runtimeFingerprint:current.fingerprint,canonicalOnly:[...canonicalOnly],canonicalSource:'Existing native Sites source repository and saved version',coverage:'All other deployed runtime source files must match the public GitHub code mirror. Owner-excluded image-path/layout JSON and roster snapshots are hash-pinned only; restore the private source overlay before building.'};
 add('ops/source-mirror.json',Buffer.from(JSON.stringify(receipt,null,2)+'\n'),'mirror-receipt');
 add('public/source-manifest.json',currentBytes,'runtime-manifest');
 if(includeRosterWorkflow)add('ops/gagether-rosters.yml',readSource(root,'ops/gagether-rosters.yml'),'roster-workflow','.github/workflows/gagether-rosters.yml');
 const deletions=old.entries.filter(e=>!current.entries.some(n=>n.path===e.path)&&!protectedPath(e.path)).map(e=>({path:'web/'+e.path,previousSha256:e.sha256}));
 const plan={version:1,siteVersion,baselineFingerprint:old.fingerprint,runtimeFingerprint:current.fingerprint,verifiedRuntimeFiles:current.entries.length,canonicalOnly:[...canonicalOnly],protectedRuntimeFiles:current.entries.filter(e=>protectedPath(e.path)),deletions,files:[],totals:{files:files.size,parts:0,bytes:0}};
 const pieces=[];
 for(const file of [...files.values()].sort((a,b)=>a.path.localeCompare(b.path))){
  const parts=transferParts(file,maxPieceCharacters),metadata={path:file.path,sourcePath:file.sourcePath,category:file.category,fullFileSha256:file.sha256,fullFileBytes:file.bytes,textCharacters:file.text.length,parts:[]};
  for(let i=0;i<parts.length;i++){
   const relative='parts/'+String(pieces.length).padStart(6,'0')+'.json',json=parts[i];
   metadata.parts.push({file:relative,part:i+1,parts:parts.length,sha256:hash(Buffer.from(json)),jsonCharacters:json.length});pieces.push({relative,json});
  }
  plan.files.push(metadata);plan.totals.parts+=parts.length;plan.totals.bytes+=file.bytes;
 }
 // Validate completely before creating any output, including changed build data.
 if(!readSource(root,'public/source-manifest.json').equals(currentBytes))throw Error('Source manifest changed during preparation');
 mkdirSync(path.dirname(destination),{recursive:true});
 if(inside(root,realpathSync(path.dirname(destination))))throw Error('Output parent resolves into the source repository');
 mkdirSync(destination); // Atomic ownership: never reuse or remove an existing directory.
 try{
  mkdirSync(path.join(destination,'parts'));
  for(const piece of pieces)writeFileSync(path.join(destination,piece.relative),piece.json,{flag:'wx'});
  writeFileSync(path.join(destination,'plan.json'),JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
 }catch(error){rmSync(destination,{recursive:true,force:true});throw error;}
 return {planPath:path.join(destination,'plan.json'),siteVersion,runtimeFingerprint:current.fingerprint,baselineFingerprint:old.fingerprint,verifiedRuntimeFiles:current.entries.length,...plan.totals,deletions:deletions.length,protectedFiles:plan.protectedRuntimeFiles.length};
}

function main(){
 const args=process.argv.slice(2),options={};const keys={'--root':'root','--old-manifest':'oldManifestPath','--manifest':'manifestPath','--out':'outputDir','--site-version':'siteVersion'};
 for(let i=0;i<args.length;i++){
  if(args[i]==='--include-roster-workflow'){options.includeRosterWorkflow=true;continue;}
  const key=keys[args[i]];if(!key||!args[i+1]||args[i+1].startsWith('--'))throw Error('Usage: node ops/prepare-code-mirror.mjs --old-manifest FILE --out NEW_DIRECTORY --site-version REAL_VERSION [--include-roster-workflow]');
  if(key in options)throw Error('Duplicate option: '+args[i]);options[key]=args[++i];
 }
 if(!/^\d+$/.test(options.siteVersion??''))throw Error('A real saved site version is required');options.siteVersion=Number(options.siteVersion);
 console.log(JSON.stringify(prepareCodeMirror(options),null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main();}catch(error){console.error(error.message);process.exitCode=1;}
}
