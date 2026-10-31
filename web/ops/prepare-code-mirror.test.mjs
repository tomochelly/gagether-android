import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {canonicalOnly,prepareCodeMirror,transferParts,verifyManifest} from './prepare-code-mirror.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function manifest(entries){entries=entries.sort((a,b)=>a.path.localeCompare(b.path));return {version:1,fingerprint:sha(JSON.stringify(entries)),entries};}
function fixture(){
 const home=mkdtempSync(path.join(tmpdir(),'gagether-code-mirror-')),root=path.join(home,'source'),outputDir=path.join(home,'transfer'),oldManifestPath=path.join(home,'old-public-manifest.json');mkdirSync(root);
 const write=(relative,content)=>{const file=path.join(root,relative);mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,content);return file;};
 const originals=new Map([
  ['lib/changed.ts',Buffer.from('\ufeff'+"export const text = '한글 日本 😀';\n".repeat(2200))],
  ['lib/same.ts',Buffer.from('export const same = true;\n')],
  ['components/new.tsx',Buffer.from('export default function New(){return null}\n')],
  ...canonicalOnly.map((relative,i)=>[relative,Buffer.from(JSON.stringify({privateCanonical:'DO_NOT_TRANSFER_CANONICAL_'+i}))]),
 ]);
 for(const [relative,bytes]of originals)write(relative,bytes);
 write('content/character-rosters/recovery/000.b64','DO_NOT_TRANSFER_RECOVERY');
 const current=manifest([...originals].map(([relative,bytes])=>({path:relative,sha256:sha(bytes)})));
 const old=manifest(current.entries.filter(e=>e.path!=='components/new.tsx').map(e=>({...e,sha256:e.path==='lib/changed.ts'||canonicalOnly.includes(e.path)?sha('old '+e.path):e.sha256})).concat({path:'lib/removed.ts',sha256:sha('removed')}));
 write('public/source-manifest.json',JSON.stringify(current,null,2)+'\n');writeFileSync(oldManifestPath,JSON.stringify(old,null,2)+'\n');
 for(const relative of ['scripts/safe.mjs','scripts/sites-env.mjs','scripts/discord-secret-handoff.mjs','scripts/generated/private.mjs','scripts/private/key.mjs','scripts/qa/capture.mjs','scripts/connector-preview/host-binding.mjs','scripts/.env'])write(relative,'// '+relative+'\n');
 execFileSync('git',['init','-q',root],{stdio:'pipe'});execFileSync('git',['-C',root,'add','scripts'],{stdio:'pipe'});
 write('scripts/untracked.mjs','// never copied\n');write('ops/qa/native-result.json','DO_NOT_TRANSFER_QA');write('ops/character-rosters/run.py','# reviewed collector\n');write('tests/roster-availability.test.mjs','// selected fixture test\n');write('tests/character-rosters.test.mjs','// data-specific test must stay out\n');
 write('ops/gagether-rosters.yml',"name: roster\non:\n  schedule:\n    - cron: '31 */6 * * *'\npermissions: {}\n");
 const options={root,oldManifestPath,outputDir,siteVersion:219,maxPieceCharacters:2048};
 const rewriteCurrent=entries=>{const changed=manifest(entries);write('public/source-manifest.json',JSON.stringify(changed,null,2)+'\n');return changed;};
 return {home,root,write,old,current,originals,options,rewriteCurrent,cleanup:()=>rmSync(home,{recursive:true,force:true})};
}
function readTransfer(outputDir){
 const plan=JSON.parse(readFileSync(path.join(outputDir,'plan.json'),'utf8')),files=new Map();
 for(const file of plan.files){
  const text=file.parts.map((metadata,i)=>{
   const raw=readFileSync(path.join(outputDir,metadata.file),'utf8'),piece=JSON.parse(raw);
   assert.equal(sha(Buffer.from(raw)),metadata.sha256);assert.equal(raw.length,metadata.jsonCharacters);
   assert.equal(piece.path,file.path);assert.equal(piece.part,i+1);assert.equal(piece.parts,file.parts.length);assert.equal(piece.fullFileSha256,file.fullFileSha256);assert.equal(piece.fullFileBytes,file.fullFileBytes);assert.equal(piece.encoding,'utf8');
   return piece.content;
  }).join('');
  const bytes=Buffer.from(text);assert.equal(bytes.length,file.fullFileBytes);assert.equal(sha(bytes),file.fullFileSha256);files.set(file.path,bytes);
 }
 return {plan,files};
}

test('prepares exact bounded changed-code pieces, reviewed extras and final-version pins without protected data',()=>{
 const f=fixture();try{
  const summary=prepareCodeMirror(f.options),{plan,files}=readTransfer(f.options.outputDir);
  assert.equal(summary.siteVersion,219);assert.equal(summary.runtimeFingerprint,f.current.fingerprint);assert.equal(plan.baselineFingerprint,f.old.fingerprint);assert.equal(plan.verifiedRuntimeFiles,f.current.entries.length);
  assert.ok(files.get('web/lib/changed.ts').equals(f.originals.get('lib/changed.ts')));assert.ok(files.has('web/components/new.tsx'));assert.ok(!files.has('web/lib/same.ts'));
  assert.ok(files.has('web/scripts/safe.mjs'));assert.ok(files.has('web/ops/character-rosters/run.py'));assert.ok(files.has('web/tests/roster-availability.test.mjs'));
  for(const relative of ['scripts/sites-env.mjs','scripts/discord-secret-handoff.mjs','scripts/generated/private.mjs','scripts/private/key.mjs','scripts/qa/capture.mjs','scripts/connector-preview/host-binding.mjs','scripts/.env','scripts/untracked.mjs','ops/qa/native-result.json','tests/character-rosters.test.mjs',...canonicalOnly,'content/character-rosters/recovery/000.b64'])assert.ok(!files.has('web/'+relative),relative);
  assert.deepEqual(plan.deletions,[{path:'web/lib/removed.ts',previousSha256:sha('removed')}]);assert.deepEqual(plan.canonicalOnly,canonicalOnly);assert.equal(plan.protectedRuntimeFiles.length,3);
  const receipt=JSON.parse(files.get('web/ops/source-mirror.json'));assert.equal(receipt.siteVersion,219);assert.equal(receipt.runtimeFingerprint,f.current.fingerprint);assert.deepEqual(receipt.canonicalOnly,canonicalOnly);
  assert.ok(files.get('web/public/source-manifest.json').equals(readFileSync(path.join(f.root,'public/source-manifest.json'))));
  for(const file of plan.files)for(const p of file.parts){const raw=readFileSync(path.join(f.options.outputDir,p.file),'utf8');assert.ok(raw.length<=2048);assert.doesNotMatch(raw,/DO_NOT_TRANSFER_/);}
  assert.ok(plan.files.find(p=>p.path==='web/lib/changed.ts').parts.length>1);
 }finally{f.cleanup();}
});
test('refuses either invalid fingerprint and malformed manifest contents without writing output or revealing content',()=>{
 for(const which of ['old','current','malformed']){const f=fixture();try{
  if(which==='malformed')writeFileSync(f.options.oldManifestPath,'SECRET_CONTENT_MUST_NOT_APPEAR');
  else{const broken={...(which==='old'?f.old:f.current),fingerprint:'0'.repeat(64)};writeFileSync(which==='old'?f.options.oldManifestPath:path.join(f.root,'public/source-manifest.json'),JSON.stringify(broken));}
  assert.throws(()=>prepareCodeMirror(f.options),error=>!error.message.includes('SECRET_CONTENT_MUST_NOT_APPEAR')&&/fingerprint|parse/.test(error.message));assert.ok(!existsSync(f.options.outputDir));
 }finally{f.cleanup();}}
});
test('verifies current protected data hashes as well as ordinary runtime hashes before exporting',()=>{
 for(const relative of ['lib/changed.ts',canonicalOnly[0]]){const f=fixture();try{
  f.write(relative,'modified after build');assert.throws(()=>prepareCodeMirror(f.options),/does not match final source manifest/);assert.ok(!existsSync(f.options.outputDir));
 }finally{f.cleanup();}}
});
test('detects a newly added runtime file omitted by a stale manifest',()=>{
 const f=fixture();try{
  f.write('lib/new-after-build.ts','export const later = true;\n');assert.throws(()=>prepareCodeMirror(f.options),/inventory differs/);assert.ok(!existsSync(f.options.outputDir));
 }finally{f.cleanup();}
});
test('rejects traversal, duplicate pins, missing canonical pins and recovery payloads as runtime entries',()=>{
 const f=fixture();try{
  const additions=[{path:'../private.json',sha256:sha('private')},{path:'content/character-rosters/recovery/000.b64',sha256:sha('DO_NOT_TRANSFER_RECOVERY')},f.current.entries[0]];
  for(const entry of additions){const invalid=manifest([...f.current.entries,entry]);assert.throws(()=>verifyManifest(invalid),/relative|runtime|Duplicate/);}
  assert.throws(()=>verifyManifest(manifest(f.current.entries.filter(e=>e.path!==canonicalOnly[0]))),/canonical-only hash pins/);
 }finally{f.cleanup();}
});
test('refuses symlinked source files and parent directories',()=>{
 for(const parent of [false,true]){const f=fixture();try{
  if(parent){rmSync(path.join(f.root,'lib'),{recursive:true});symlinkSync(f.home,path.join(f.root,'lib'));writeFileSync(path.join(f.home,'changed.ts'),f.originals.get('lib/changed.ts'));}
  else{rmSync(path.join(f.root,'lib/changed.ts'));const outside=path.join(f.home,'outside.ts');writeFileSync(outside,f.originals.get('lib/changed.ts'));symlinkSync(outside,path.join(f.root,'lib/changed.ts'));}
  assert.throws(()=>prepareCodeMirror(f.options),/non-symlink/);assert.ok(!existsSync(f.options.outputDir));
 }finally{f.cleanup();}}
});
test('refuses existing outputs, repository-local outputs, symlinked output parents and invalid versions',()=>{
 const f=fixture();try{
  const existing=path.join(f.home,'existing');mkdirSync(existing);writeFileSync(path.join(existing,'keep.txt'),'untouched');
  assert.throws(()=>prepareCodeMirror({...f.options,outputDir:existing}),/new directory/);assert.equal(readFileSync(path.join(existing,'keep.txt'),'utf8'),'untouched');
  assert.throws(()=>prepareCodeMirror({...f.options,outputDir:path.join(f.root,'transfer')}),/outside/);
  const link=path.join(f.home,'output-link');symlinkSync(f.root,link);assert.throws(()=>prepareCodeMirror({...f.options,outputDir:path.join(link,'transfer')}),/resolves into/);
  for(const siteVersion of [0,-1,1.2,'219',undefined])assert.throws(()=>prepareCodeMirror({...f.options,siteVersion}),/real positive saved site version/);
 }finally{f.cleanup();}
});
test('rejects invalid UTF-8 rather than changing source bytes during transfer',()=>{
 const f=fixture();try{
  const bytes=Buffer.from([0xff,0xfe,0xfd]);f.write('lib/changed.ts',bytes);f.rewriteCurrent(f.current.entries.map(e=>e.path==='lib/changed.ts'?{...e,sha256:sha(bytes)}:e));
  assert.throws(()=>prepareCodeMirror(f.options),/exact UTF-8/);assert.ok(!existsSync(f.options.outputDir));
 }finally{f.cleanup();}
});
test('optional workflow is byte-exact at its actual repository path',()=>{
 const f=fixture();try{
  prepareCodeMirror({...f.options,includeRosterWorkflow:true});const {files}=readTransfer(f.options.outputDir);
  assert.ok(files.get('.github/workflows/gagether-rosters.yml').equals(readFileSync(path.join(f.root,'ops/gagether-rosters.yml'))));assert.ok(!files.has('web/ops/gagether-rosters.yml'));
 }finally{f.cleanup();}
});
test('piece limits include JSON escaping and never split Unicode surrogate pairs',()=>{
 const text=('😀\n\u0000\\"日本語').repeat(1000),bytes=Buffer.from(text),file={path:'web/lib/control.ts',text,bytes:bytes.length,sha256:sha(bytes)};
 const pieces=transferParts(file,1024);assert.ok(pieces.length>1);
 assert.equal(pieces.map(raw=>{assert.ok(raw.length<=1024);const content=JSON.parse(raw).content;assert.doesNotMatch(content,/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/);return content;}).join(''),text);
 for(const bound of [1000,50001,1.2])assert.throws(()=>transferParts(file,bound),/1024 to 50000/);
});
